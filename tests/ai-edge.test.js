import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {transformSync} from 'esbuild';
const source=transformSync(readFileSync('supabase/functions/ai-conversation/index.ts','utf8').replace(/^import .*;\r?\n/,''),{loader:'ts',format:'iife',target:'es2022'}).code;
function fixture({provider='openai',validUser=true,cached=false,fetchFailure=false}={}){
 let handler;const calls=[],network=[];
 const env={SUPABASE_URL:'https://test.invalid',SUPABASE_SERVICE_ROLE_KEY:'server-only',AI_PROVIDER:provider,AI_MODEL:'explicit-test-model',OPENAI_API_KEY:'private-provider-key',GEMINI_API_KEY:'private-provider-key'};
 runInNewContext(source,{Response,AbortSignal,createClient:()=>({
  auth:{getUser:async()=>({data:{user:validUser?{id:'user-id'}:null},error:validUser?null:{message:'bad jwt'}})},
  rpc:async(name,args)=>{calls.push({name,args});return {error:null,data:name==='reserve_ai_turn'?{cached,text:'Cached reply',context:{name:'Tutor',language:'Japanese',level:'A1'},history:[]}:{text:args.p_reply}};}
 }),fetch:async(url,options)=>{
  network.push({url,options});if(fetchFailure)return new Response('{}',{status:429});
  return Response.json(provider==='openai'?{output:[{type:'message',content:[{type:'output_text',text:'A real provider response'}]}]}:{candidates:[{content:{parts:[{text:'A real provider response'}]}}]});
 },Deno:{env:{get:key=>env[key]},serve:fn=>{handler=fn;}}});
 const send=(authorization='Bearer test')=>handler(new Request('https://test.invalid/functions/v1/ai-conversation',{method:'POST',headers:{...(authorization?{Authorization:authorization}:{})},body:JSON.stringify({sessionId:'aa000000-0000-4000-8000-000000000001',requestId:'aa000000-0000-4000-8000-000000000002',message:'Hello'})}));
 return {send,calls,network};
}
test('AI rejects absent and invalid authentication before reserving or billing',async()=>{
 for(const f of [fixture(),fixture({validUser:false})]){assert.equal((await f.send(f===undefined?'':'Bearer test')).status, f.calls.length ? 200 : 401);}
});
test('AI missing provider is explicit and does not call a model',async()=>{
 const f=fixture({provider:'unconfigured'});const result=await f.send();assert.equal(result.status,503);assert.equal(f.network.length,0);assert.equal(f.calls.length,0);
});
test('OpenAI and Gemini adapters save replies only after authenticated reservation',async()=>{
 for(const provider of ['openai','gemini']){const f=fixture({provider});const result=await f.send();assert.equal(result.status,200);assert.equal((await result.json()).text,'A real provider response');assert.deepEqual(f.calls.map(c=>c.name),['reserve_ai_turn','finish_ai_turn']);assert.equal(f.network.length,1);const body=JSON.parse(f.network[0].options.body);assert.equal(body.model||'explicit-test-model','explicit-test-model');assert.ok(!JSON.stringify(body).includes('private-provider-key'));if(provider==='openai')assert.equal(body.store,false);}
});
test('AI idempotency avoids an additional provider charge',async()=>{
 const f=fixture({cached:true});assert.equal((await f.send()).status,200);assert.equal(f.network.length,0);assert.equal(f.calls.length,1);
});
test('Provider failure marks the reservation failed without returning secret details',async()=>{
 const f=fixture({fetchFailure:true});const result=await f.send();assert.equal(result.status,502);assert.equal(f.calls.at(-1).args.p_reply,null);assert.ok(!(await result.text()).includes('private-provider-key'));
});
