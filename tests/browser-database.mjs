// Test-only HTTP adapter. Runs real migrations/RLS/RPCs in isolated PGlite.
// Auth, Storage, and the PostgREST transport remain test doubles.
import {readFile,readdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
const require=createRequire(resolve('.tools/db-verify/package.json'));
export const db=new (require('@electric-sql/pglite').PGlite)();
export const uid='ad000000-0000-4000-8000-000000000001';
const smoke=await readFile('supabase/tests/pglite-smoke.mjs','utf8');
// Reuse only the explicitly documented Auth/Storage fixture DDL.
const stub=smoke.match(/await db\.exec\(`([\s\S]*?)`\)/)[1];
await db.exec(stub);
for(const name of (await readdir('supabase/migrations')).filter(n=>n.endsWith('.sql')).sort()) await db.exec(await readFile('supabase/migrations/'+name,'utf8'));
await db.exec(await readFile('supabase/seed.sql','utf8'));
await db.query("insert into auth.users(id,email,raw_user_meta_data) values($1,'browser@example.test','{\"display_name\":\"Browser learner\"}')",[uid]);
await db.query("insert into public.rooms(id,slug,name,kind,capacity,status) values('ad100000-0000-4000-8000-000000000001','browser-room','Browser study room','study',20,'published')");
const user={id:uid,aud:'authenticated',role:'authenticated',email:'browser@example.test',user_metadata:{display_name:'Browser learner'},app_metadata:{provider:'email',providers:['email']},created_at:new Date().toISOString()};
const b64=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
const token=b64({alg:'HS256',typ:'JWT'})+'.'+b64({sub:uid,aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})+'.browser-test';
let queue=Promise.resolve();
const ident=s=>{if(!/^[a-z_][a-z0-9_]*$/i.test(s))throw new Error('Invalid identifier');return '"'+s+'"';};
const relations={
 courses:{language:['languages','language_id','id',false],units:['units','id','course_id',true]},
 units:{lessons:['lessons','id','unit_id',true]},
 lessons:{unit:['units','unit_id','id',false]},
 user_languages:{language:['languages','language_id','id',false]},
 lesson_progress:{lesson:['lessons','lesson_id','id',false]},
 user_achievements:{achievement:['achievements','achievement_id','id',false]},
 games:{releases:['game_releases','id','game_id',true]},
 ai_characters:{language:['languages','language_id','id',false],scenarios:['ai_scenarios','id','character_id',true]},
 opportunities:{language:['languages','language_id','id',false]},
 rooms:{language:['languages','language_id','id',false]},
 pdf_templates:{language:['languages','language_id','id',false]},
 avatar_assets:{versions:['avatar_asset_versions','id','asset_id',true]},
 avatars:{equipment:['avatar_equipment','id','avatar_id',true]},
 avatar_equipment:{version:['avatar_asset_versions','asset_version_id','id',false]},
 avatar_asset_versions:{asset:['avatar_assets','asset_id','id',false]},
};
async function expand(table,rows,projection,depth=0){
 if(depth>4)return rows;
 for(const row of rows){
  for(const [alias,[target,source,key,many]] of Object.entries(relations[table]||{})){
   if(!projection.includes(alias+'(')&&!projection.includes(alias+':'))continue;
   const related=(await db.query('select * from public.'+ident(target)+' where '+ident(key)+'=$1',[row[source]])).rows;
   // Only follow explicitly requested nested relations; this test adapter is not a PostgREST implementation.
   let nested=projection;
   if(table==='avatar_asset_versions')nested='*';
   await expand(target,related,nested,depth+1);
   if(table==='lessons'&&alias==='unit')for(const unit of related)unit.course=(await db.query('select * from public.courses where id=$1',[unit.course_id])).rows[0]||null;
   row[alias]=many?related:related[0]||null;
  }
 }
 return rows;
}
export async function installRoutes(page){
 const failures=[];
 await page.route('**/auth/v1/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  const data=path.endsWith('/token')?{access_token:token,refresh_token:'test-refresh',expires_in:3600,token_type:'bearer',user}:path.endsWith('/logout')?{}:user;
  await route.fulfill({json:data});
 });
 await page.route('**/rest/v1/**',route=>{
  queue=queue.catch(()=>{}).then(async()=>{
   const request=route.request(),url=new URL(request.url()),parts=url.pathname.split('/rest/v1/')[1].split('/');
   const authenticated=request.headers().authorization==='Bearer '+token;
   try{
    await db.exec('begin; set local role '+(authenticated?'authenticated':'anon'));
    await db.query("select set_config('request.jwt.claim.sub',$1,true)",[authenticated?uid:'']);
    let data,total=0;
    if(parts[0]==='rpc'){
     const body=request.postDataJSON()||{},values=Object.values(body);
     const args=Object.keys(body).map((key,i)=>ident(key)+' => $'+(i+1)).join(',');
     data=(await db.query('select public.'+ident(parts[1])+'('+args+') as result',values)).rows[0].result;
    }else{
     const table=ident(parts[0]),values=[],conditions=[];
     for(const [key,value] of url.searchParams){
      if(['select','order','limit','offset'].includes(key))continue;
      const dot=value.indexOf('.'),op=value.slice(0,dot),valueText=value.slice(dot+1);
      if(op==='eq'){values.push(valueText);conditions.push(ident(key)+'=$'+values.length);}
      else throw new Error('Unhandled filter: '+op);
     }
     const where=conditions.length?' where '+conditions.join(' and '):'';
     let rows;
     if(['GET','HEAD'].includes(request.method())){
      let sql='select * from public.'+table+where;
      const order=url.searchParams.get('order');
      if(order)sql+=' order by '+order.split(',').map(s=>{const [col,dir,nulls]=s.split('.');return ident(col)+(dir==='desc'?' desc':' asc')+(nulls==='nullsfirst'?' nulls first':' nulls last');}).join(',');
      if(url.searchParams.has('limit'))sql+=' limit '+Number(url.searchParams.get('limit'));
      if(url.searchParams.has('offset'))sql+=' offset '+Number(url.searchParams.get('offset'));
      rows=(await db.query(sql,values)).rows;total=rows.length;
      rows=await expand(parts[0],rows,url.searchParams.get('select')||'*');
     }else if(request.method()==='PATCH'){
      const body=request.postDataJSON(),sets=Object.entries(body).map(([key,val])=>{values.push(val);return ident(key)+'=$'+values.length;});
      rows=(await db.query('update public.'+table+' set '+sets.join(',')+where+' returning *',values)).rows;
     }else if(request.method()==='POST'){
      const body=request.postDataJSON();
      rows=(await db.query('insert into public.'+table+'('+Object.keys(body).map(ident).join(',')+') values('+Object.keys(body).map((_,i)=>'$'+(i+1)).join(',')+') returning *',Object.values(body))).rows;
     }else throw new Error('Unhandled method '+request.method());
     data=request.headers().accept?.includes('vnd.pgrst.object')?rows[0]||null:rows;
    }
    await db.exec('commit');
    await route.fulfill({status:200,headers:{'Content-Type':'application/json','Content-Range':'0-'+Math.max(0,total-1)+'/'+total,'Access-Control-Expose-Headers':'Content-Range'},body:request.method()==='HEAD'?'':JSON.stringify(data)});
   }catch(error){
    await db.exec('rollback');failures.push(parts.join('/')+': '+error.message);
    await route.fulfill({status:400,json:{message:error.message,code:error.code||'TEST_ADAPTER'}});
   }
  });
  return queue;
 });
 return failures;
}
