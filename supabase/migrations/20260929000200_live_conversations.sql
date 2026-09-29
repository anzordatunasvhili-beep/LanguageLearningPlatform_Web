-- Persisted AI chat. Only a verified Edge Function can reserve and commit model turns.
begin;
create table public.conversation_messages (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.conversation_sessions(id) on delete cascade,
  role text not null check(role in ('user','assistant')),
  content text not null check(char_length(content) between 1 and 6000),
  created_at timestamptz not null default now()
);
create index conversation_messages_session_idx on public.conversation_messages(session_id,id);
alter table public.conversation_messages enable row level security;
revoke all on public.conversation_messages from public,anon,authenticated;
grant select on public.conversation_messages to authenticated;
create policy own_conversation_messages on public.conversation_messages for select to authenticated using(exists(select 1 from public.conversation_sessions s where s.id=session_id and s.user_id=(select auth.uid())));
create table private.ai_requests (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null references public.conversation_sessions(id) on delete cascade,
  message text not null,
  reply text,
  status text not null default 'pending' check(status in ('pending','completed','failed')),
  created_at timestamptz not null default now()
);
create index ai_requests_user_time_idx on private.ai_requests(user_id,created_at);
alter table private.ai_requests enable row level security;
revoke all on private.ai_requests from public,anon,authenticated;

create function public.open_conversation(p_scenario uuid,p_new boolean default false) returns uuid
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); sid uuid;
begin
 if uid is null then raise exception 'Sign in required' using errcode='42501'; end if;
 perform 1 from public.account_progress where user_id=uid for update;
 if not exists(select 1 from public.ai_scenarios s join public.ai_characters c on c.id=s.character_id join public.languages l on l.id=c.language_id where s.id=p_scenario and s.status='published' and c.status='published' and l.enabled) then raise exception 'Scenario unavailable'; end if;
 if not p_new then select id into sid from public.conversation_sessions where user_id=uid and scenario_id=p_scenario and status='active' order by started_at desc limit 1; end if;
 if sid is null then
   if (select count(*) from public.conversation_sessions where user_id=uid and started_at>now()-interval '1 day')>=20 then raise exception 'Daily conversation limit reached'; end if;
   insert into public.conversation_sessions(user_id,scenario_id) values(uid,p_scenario) returning id into sid;
 end if;
 return sid;
end $$;
revoke all on function public.open_conversation(uuid,boolean) from public,anon;
grant execute on function public.open_conversation(uuid,boolean) to authenticated;

create function public.reserve_ai_turn(p_user uuid,p_session uuid,p_request uuid,p_message text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare session public.conversation_sessions%rowtype; request private.ai_requests%rowtype; context jsonb; history jsonb;
begin
 if p_user is null or p_request is null or p_message is null or char_length(btrim(p_message)) not between 1 and 1500 then raise exception 'Write a message between 1 and 1500 characters'; end if;
 perform 1 from public.account_progress where user_id=p_user for update;
 select * into session from public.conversation_sessions where id=p_session and user_id=p_user and status='active' for update;
 if not found then raise exception 'Conversation unavailable' using errcode='42501'; end if;
 select * into request from private.ai_requests where id=p_request;
 if found then
   if request.user_id<>p_user or request.session_id<>p_session or request.message<>btrim(p_message) then raise exception 'Request mismatch' using errcode='42501'; end if;
   if request.status='completed' then return jsonb_build_object('cached',true,'text',request.reply); end if;
   raise exception 'This request was already submitted. Reload the conversation before trying again.';
 end if;
 if exists(select 1 from private.ai_requests where user_id=p_user and status='pending' and created_at>now()-interval '2 minutes') then raise exception 'Wait for your current reply'; end if;
 if (select count(*) from private.ai_requests where user_id=p_user and created_at>now()-interval '1 day')>=30 then raise exception 'Daily AI limit reached (30 replies)'; end if;
 if (select count(*) from public.conversation_messages where session_id=p_session)>=60 then raise exception 'Start a new conversation to continue'; end if;
 select jsonb_build_object('name',c.name,'biography',c.biography,'language',l.name,'title',s.title,'objective',s.objective,'level',s.level) into context
 from public.ai_scenarios s join public.ai_characters c on c.id=s.character_id join public.languages l on l.id=c.language_id where s.id=session.scenario_id and s.status='published' and c.status='published' and l.enabled;
 if context is null then raise exception 'Scenario unavailable'; end if;
 update private.ai_requests set status='failed' where user_id=p_user and status='pending';
 -- Content retention: prune this user's message history older than 30 days on activity.
 delete from public.conversation_messages m using public.conversation_sessions s where m.session_id=s.id and s.user_id=p_user and m.created_at<now()-interval '30 days';
 delete from private.ai_requests where user_id=p_user and created_at<now()-interval '30 days';
 select coalesce(jsonb_agg(to_jsonb(m) order by m.id),'[]') into history from (select id,role,content from public.conversation_messages where session_id=p_session order by id desc limit 12) m;
 insert into private.ai_requests(id,user_id,session_id,message) values(p_request,p_user,p_session,btrim(p_message));
 return jsonb_build_object('cached',false,'context',context,'history',history);
end $$;

create function public.finish_ai_turn(p_request uuid,p_reply text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare request private.ai_requests%rowtype; selected_character uuid;
begin
 select * into request from private.ai_requests where id=p_request;
 if not found then raise exception 'Request unavailable'; end if;
 perform 1 from public.account_progress where user_id=request.user_id for update;
 select * into request from private.ai_requests where id=p_request for update;
 if request.status='completed' then return jsonb_build_object('text',request.reply); end if;
 if request.status<>'pending' then raise exception 'Request is no longer active'; end if;
 if p_reply is null then update private.ai_requests set status='failed' where id=p_request; return '{}'; end if;
 if char_length(btrim(p_reply)) not between 1 and 6000 then raise exception 'Invalid model response'; end if;
 insert into public.conversation_messages(session_id,role,content) values(request.session_id,'user',request.message),(request.session_id,'assistant',btrim(p_reply));
 update private.ai_requests set status='completed',reply=btrim(p_reply) where id=p_request;
 select c.id into selected_character from public.conversation_sessions cs join public.ai_scenarios s on s.id=cs.scenario_id join public.ai_characters c on c.id=s.character_id where cs.id=request.session_id;
 insert into public.character_relationships(user_id,character_id,affinity) values(request.user_id,selected_character,1)
 on conflict(user_id,character_id) do update set affinity=public.character_relationships.affinity+1,updated_at=now();
 return jsonb_build_object('text',btrim(p_reply));
end $$;
revoke all on function public.reserve_ai_turn(uuid,uuid,uuid,text),public.finish_ai_turn(uuid,text) from public,anon,authenticated;
grant execute on function public.reserve_ai_turn(uuid,uuid,uuid,text),public.finish_ai_turn(uuid,text) to service_role;
commit;
