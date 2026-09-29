-- Run after the four foundation migrations. Existing accounts/content are retained.
begin;

-- Normalize the first seed's private answer format into the grading contract.
update private.exercise_solutions set solution =
  case when solution ? 'optionId' then jsonb_build_object('answer',solution->'optionId')
       when solution ? 'acceptedAnswers' then jsonb_build_object('answers',solution->'acceptedAnswers')
       else solution end;

create table private.practice_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete restrict,
  release_id uuid references public.game_releases(id) on delete restrict,
  language_id uuid not null references public.languages(id),
  content_version integer not null,
  reward integer not null check (reward between 0 and 10000),
  questions jsonb not null,
  answers jsonb not null default '{}',
  result jsonb,
  started_at timestamptz not null default now()
);
create index practice_runs_user_time on private.practice_runs(user_id, started_at desc);
alter table private.practice_runs enable row level security;
revoke all on private.practice_runs from public, anon, authenticated;
grant all on private.practice_runs to service_role;

create table public.room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index room_messages_room_time on public.room_messages(room_id, created_at desc);
alter table public.room_messages enable row level security;
revoke all on public.room_messages from public, anon, authenticated;
grant all on public.room_messages to service_role;

alter table public.user_settings add column preferred_language_id uuid references public.languages(id);
grant update (preferred_language_id) on public.user_settings to authenticated;

-- Do not expose fictional listings through public reads.
drop policy published_opportunities on public.opportunities;
create policy published_opportunities on public.opportunities for select to anon, authenticated
  using (not is_demo and status = 'published' and (language_id is null or exists
    (select 1 from public.languages l where l.id = language_id and l.enabled)));

create function private.award_activity(uid uuid, lang uuid, kind text, event_key text, amount integer, activity_minutes integer default 0)
returns integer language plpgsql security invoker set search_path = '' as $$
declare inserted_id uuid; zone text; today date; previous_day date; streak integer;
begin
  if amount < 0 or amount > 10000 then raise exception 'Invalid reward'; end if;
  perform 1 from public.account_progress where user_id = uid for update;
  insert into public.progress_events(user_id, language_id, source_kind, source_key, xp_delta)
    values(uid, lang, kind, event_key, amount) on conflict do nothing returning id into inserted_id;
  if inserted_id is null then return 0; end if;
  select s.timezone into zone from public.user_settings s where s.user_id = uid;
  if not exists(select 1 from pg_timezone_names where name = zone) then zone := 'UTC'; end if;
  today := (now() at time zone zone)::date;
  select last_activity_date, current_streak into previous_day, streak from public.account_progress where user_id = uid;
  if kind in ('lesson','game','conversation') then
    streak := case when previous_day = today then streak when previous_day = today - 1 then streak + 1 else 1 end;
    update public.account_progress set total_xp = total_xp + amount, current_streak = streak,
      best_streak = greatest(best_streak, streak), last_activity_date = today where user_id = uid;
  else
    update public.account_progress set total_xp = total_xp + amount where user_id = uid;
  end if;
  insert into public.daily_activity(user_id, activity_date, timezone, minutes, xp, target_met)
    values(uid, today, zone, activity_minutes, amount,
      activity_minutes >= (select daily_target from public.user_settings where user_id = uid))
    on conflict(user_id, activity_date) do update set
      minutes = public.daily_activity.minutes + excluded.minutes,
      xp = public.daily_activity.xp + excluded.xp,
      target_met = public.daily_activity.minutes + excluded.minutes >= (select daily_target from public.user_settings where user_id = uid);
  if lang is not null then
    insert into public.user_languages(user_id, language_id, xp) values(uid, lang, amount)
      on conflict(user_id, language_id) do update set xp = public.user_languages.xp + excluded.xp;
  end if;
  return amount;
end $$;
revoke all on function private.award_activity(uuid,uuid,text,text,integer,integer) from public, anon, authenticated;

create function private.refresh_rewards(uid uuid)
returns integer language plpgsql security invoker set search_path = '' as $$
declare item record; metric text; target integer; achieved integer; since_date date; zone text; today date; extra integer := 0; already boolean;
begin
  select timezone into zone from public.user_settings where user_id = uid;
  if not exists(select 1 from pg_timezone_names where name = zone) then zone := 'UTC'; end if;
  today := (now() at time zone zone)::date;
  for item in select id, requirement, xp_reward, cosmetic_reward_id from public.achievements where enabled loop
    if coalesce(item.requirement->>'target','') !~ '^[1-9][0-9]{0,6}$' then continue; end if;
    metric := item.requirement->>'metric'; target := greatest(1, (item.requirement->>'target')::integer);
    achieved := case metric
      when 'lessons_completed' then (select count(*) from public.lesson_progress where user_id=uid and completed_at is not null)
      when 'current_streak' then (select current_streak from public.account_progress where user_id=uid and last_activity_date >= today-1)
      when 'games_completed' then (select count(*) from public.game_sessions where user_id=uid and verification_status='verified')
      else 0 end;
    achieved := coalesce(achieved,0);
    select earned_at is not null into already from public.user_achievements where user_id=uid and achievement_id=item.id;
    insert into public.user_achievements(user_id, achievement_id, progress, earned_at)
      values(uid,item.id,least(achieved,target),case when achieved>=target then now() end)
      on conflict(user_id,achievement_id) do update set progress=greatest(public.user_achievements.progress,excluded.progress),
        earned_at=coalesce(public.user_achievements.earned_at,excluded.earned_at);
    if achieved>=target and not coalesce(already,false) then
      extra := extra + private.award_activity(uid,null,'achievement',item.id::text,least(item.xp_reward,10000));
      if item.cosmetic_reward_id is not null then
        insert into public.user_cosmetics(user_id,asset_id,source) values(uid,item.cosmetic_reward_id,'achievement:'||item.id) on conflict do nothing;
      end if;
    end if;
  end loop;
  for item in select id,kind,requirement,xp_reward from public.quests where enabled and kind in ('daily','weekly') loop
    if coalesce(item.requirement->>'target','') !~ '^[1-9][0-9]{0,6}$' then continue; end if;
    since_date := case when item.kind='weekly' then date_trunc('week',today::timestamp)::date else today end;
    metric := item.requirement->>'metric'; target := greatest(1,(item.requirement->>'target')::integer);
    achieved := case metric
      when 'lessons_completed' then (select count(distinct lesson_id) from public.lesson_attempts where user_id=uid and status='completed' and accuracy>=80 and completed_at >= since_date::timestamp at time zone zone)
      when 'words_practiced' then (select coalesce(sum((result->>'correct')::int),0) from private.practice_runs where user_id=uid and result is not null and started_at >= since_date::timestamp at time zone zone)
      when 'games_completed' then (select count(distinct release_id) from public.game_sessions where user_id=uid and verification_status='verified' and completed_at >= since_date::timestamp at time zone zone)
      else 0 end;
    select completed_at is not null into already from public.user_quests where user_id=uid and quest_id=item.id and period_start=since_date;
    insert into public.user_quests(user_id,quest_id,period_start,progress,completed_at)
      values(uid,item.id,since_date,least(achieved,target),case when achieved>=target then now() end)
      on conflict(user_id,quest_id,period_start) do update set progress=greatest(public.user_quests.progress,excluded.progress), completed_at=coalesce(public.user_quests.completed_at,excluded.completed_at);
    if achieved>=target and not coalesce(already,false) then
      extra := extra + private.award_activity(uid,null,'quest',item.id||':'||since_date,least(item.xp_reward,10000));
    end if;
  end loop;
  return extra;
end $$;
revoke all on function private.refresh_rewards(uuid) from public, anon, authenticated;

create function private.platform_action(action text, args jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
declare
  uid uuid := auth.uid(); run private.practice_runs; lesson record; question jsonb; reply jsonb; result jsonb;
  questions jsonb; responses jsonb; correct boolean; correct_count integer; total integer; accuracy numeric; reward integer := 0;
  extra integer := 0; duration integer; lang uuid; release uuid; room public.rooms; template public.pdf_templates;
  identity uuid; asset record; choice jsonb; selection_count integer; item record; assessed text; required_rank integer; activity_recorded boolean := false;
begin
  if uid is null then raise exception 'Sign in to continue' using errcode='42501'; end if;
  if args is null or jsonb_typeof(args)<>'object' or octet_length(args::text)>65536 then raise exception 'Invalid request'; end if;

  if action='start_practice' then
    perform 1 from public.account_progress where user_id=uid for update;
    if (select count(*) from private.practice_runs where user_id=uid and started_at>now()-interval '1 day')>=100 then raise exception 'Daily practice session limit reached'; end if;
    select l.*,c.language_id into lesson from public.lessons l join public.units u on u.id=l.unit_id
      join public.courses c on c.id=u.course_id join public.languages g on g.id=c.language_id
      where l.id=(args->>'lessonId')::uuid and l.status='published' and u.status='published' and c.status='published' and g.enabled;
    if not found then raise exception 'This lesson is unavailable'; end if;
    release := nullif(args->>'releaseId','')::uuid;
    if release is not null and not exists(select 1 from public.game_releases r join public.games g on g.id=r.game_id
      where r.id=release and r.status='published' and g.status='published' and r.platform='web'
      and r.metadata->>'engine' in ('word-dungeon','typing-trails','sentence-builder') and r.minimum_level<=1+(select total_xp/1000 from public.account_progress where user_id=uid)) then raise exception 'This game is unavailable or locked'; end if;
    if exists(select 1 from public.exercises e left join private.exercise_solutions s on s.exercise_id=e.id where e.lesson_id=lesson.id and e.status='published'
      and (s.exercise_id is null or e.type not in ('multiple_choice','typing','translation','word_order','sentence_builder','fill_blank','grammar_choice','true_false'))) then raise exception 'This lesson contains incomplete or unsupported exercises. Ask an administrator to review it.'; end if;
    select jsonb_agg(jsonb_build_object('id',e.id,'type',e.type,'prompt',e.prompt,'payload',e.payload,'solution',s.solution,'explanation',s.explanation) order by e.position)
      into questions from public.exercises e join private.exercise_solutions s on s.exercise_id=e.id where e.lesson_id=lesson.id and e.status='published';
    if questions is null or jsonb_array_length(questions) not between 1 and 100 then raise exception 'This lesson needs 1–100 published exercises'; end if;
    insert into private.practice_runs(user_id,lesson_id,release_id,language_id,content_version,reward,questions)
      values(uid,lesson.id,release,lesson.language_id,lesson.content_version,case when release is null then lesson.xp_reward else 20 end,questions) returning * into run;
    if release is null then
      insert into public.lesson_attempts(id,user_id,lesson_id,content_version) values(run.id,uid,lesson.id,lesson.content_version);
    else
      insert into public.game_sessions(id,user_id,release_id,language_id,submission_key) values(run.id,uid,release,lesson.language_id,run.id::text);
    end if;
    select jsonb_agg(q-'solution'-'explanation') into questions from jsonb_array_elements(questions) q;
    return jsonb_build_object('id',run.id,'title',lesson.title,'questions',questions,'startedAt',run.started_at);

  elsif action in ('answer','finish_practice') then
    perform 1 from public.account_progress where user_id=uid for update;
    select * into run from private.practice_runs where id=(args->>'runId')::uuid and user_id=uid for update;
    if not found then raise exception 'Practice session not found' using errcode='42501'; end if;
    if action='finish_practice' and run.result is not null then return run.result; end if;
    if run.result is not null or run.started_at<now()-interval '24 hours' then raise exception 'This session has ended'; end if;
    if action='answer' then
      select q into question from jsonb_array_elements(run.questions) q where q->>'id'=args->>'exerciseId';
      if question is null then raise exception 'Exercise is not in this session'; end if;
      if run.answers ? (args->>'exerciseId') then return run.answers->(args->>'exerciseId'); end if;
      reply := args->'answer';
      if reply is null or octet_length(reply::text)>4000 then raise exception 'Invalid answer'; end if;
      if question->>'type' in ('typing','translation','fill_blank') then
        if jsonb_typeof(reply)<>'string' then raise exception 'A text answer is required'; end if;
        select exists(select 1 from jsonb_array_elements_text(coalesce(question#>'{solution,answers}',question#>'{solution,acceptedAnswers}',jsonb_build_array(question#>'{solution,answer}'))) a
          where lower(regexp_replace(btrim(a),'\s+',' ','g'))=lower(regexp_replace(btrim(reply#>>'{}'),'\s+',' ','g'))) into correct;
      else
        correct := reply = coalesce(question#>'{solution,answer}',question#>'{solution,optionId}');
      end if;
      result := jsonb_build_object('correct',coalesce(correct,false),'explanation',question->>'explanation');
      update private.practice_runs set answers=answers||jsonb_build_object(args->>'exerciseId',result) where id=run.id;
      return result;
    end if;
    total := jsonb_array_length(run.questions);
    if (select count(*) from jsonb_object_keys(run.answers))<>total then raise exception 'Answer every exercise before finishing'; end if;
    select count(*) into correct_count from jsonb_each(run.answers) a where (a.value->>'correct')::boolean;
    accuracy := round(100.0*correct_count/total,2);
    duration := least(86400,greatest(0,extract(epoch from now()-run.started_at)::integer));
    if run.release_id is null then
      update public.lesson_attempts set status='completed',accuracy=accuracy,completed_at=now() where id=run.id;
      insert into public.lesson_progress(user_id,lesson_id,completed_at,best_accuracy,attempts)
        values(uid,run.lesson_id,case when accuracy>=80 then now() end,accuracy,1)
        on conflict(user_id,lesson_id) do update set completed_at=coalesce(public.lesson_progress.completed_at,excluded.completed_at),best_accuracy=greatest(public.lesson_progress.best_accuracy,excluded.best_accuracy),attempts=public.lesson_progress.attempts+1;
      if accuracy>=80 then
        activity_recorded := not exists(select 1 from public.progress_events where user_id=uid and source_kind='lesson' and source_key=run.lesson_id::text);
        reward := private.award_activity(uid,run.language_id,'lesson',run.lesson_id::text,run.reward,least(60,duration/60));
      end if;
    else
      update public.game_sessions g set verification_status='verified',score=correct_count*100,accuracy=round(100.0*correct_count/total,2),playtime_seconds=duration,completed_at=now(),metrics=jsonb_build_object('correct',correct_count,'total',total) where id=run.id;
      activity_recorded := not exists(select 1 from public.progress_events where user_id=uid and source_kind='game' and source_key=run.release_id||':'||(now() at time zone 'UTC')::date);
      reward := private.award_activity(uid,run.language_id,'game',run.release_id||':'||(now() at time zone 'UTC')::date,floor(run.reward*accuracy/100)::integer,least(60,duration/60));
    end if;
    -- Reviews still count as activity; their zero-XP event cannot duplicate a reward.
    if not activity_recorded then
      perform private.award_activity(uid,run.language_id,case when run.release_id is null then 'lesson' else 'game' end,'practice:'||run.id,0,least(60,duration/60));
    end if;
    result := jsonb_build_object('correct',correct_count,'total',total,'accuracy',accuracy,'xp',reward,'score',correct_count*100,'passed',accuracy>=80);
    update private.practice_runs set result=result where id=run.id;
    extra := private.refresh_rewards(uid);
    result := result||jsonb_build_object('bonusXp',extra);
    update private.practice_runs set result=result where id=run.id;
    return result;

  elsif action='save_avatar' then
    perform 1 from public.profiles where id=uid for update;
    if args->>'schemaVersion' is distinct from '1' or args->>'modelFamily' is distinct from 'humanoid-v1' or jsonb_typeof(args->'selections') is distinct from 'array' then raise exception 'Unsupported avatar definition'; end if;
    selection_count := jsonb_array_length(args->'selections');
    if selection_count not between 1 and 9 or (select count(distinct q->>'slot') from jsonb_array_elements(args->'selections') q)<>selection_count then raise exception 'Invalid equipment slots'; end if;
    select id into identity from public.avatars where user_id=uid and is_primary;
    if identity is null then insert into public.avatars(user_id,name,is_primary) values(uid,'My explorer',true) returning id into identity; end if;
    for choice in select value from jsonb_array_elements(args->'selections') loop
      select v.id into asset from public.avatar_asset_versions v join public.avatar_assets a on a.id=v.asset_id
        where a.asset_key=choice->>'assetKey' and v.version=(choice->>'assetVersion')::integer;
      if asset.id is null or not private.valid_equipment(identity,asset.id,choice->>'slot',coalesce(choice->'options','{}')) then raise exception 'An item is unavailable, incompatible, or not unlocked' using errcode='42501'; end if;
      insert into public.avatar_equipment(avatar_id,slot,asset_version_id,options) values(identity,choice->>'slot',asset.id,coalesce(choice->'options','{}'))
        on conflict(avatar_id,slot) do update set asset_version_id=excluded.asset_version_id,options=excluded.options;
    end loop;
    delete from public.avatar_equipment where avatar_id=identity and slot not in(select q->>'slot' from jsonb_array_elements(args->'selections') q);
    return args||jsonb_build_object('avatarId',identity);

  elsif action='leaderboard' then
    if coalesce(args->>'period','weekly') not in ('weekly','all') then raise exception 'Invalid ranking period'; end if;
    select coalesce(jsonb_agg(to_jsonb(r)),'[]') into result from (
      select p.username,p.display_name,coalesce(sum(e.xp_delta),0) as xp from public.profiles p join public.user_settings s on s.user_id=p.id
      join public.progress_events e on e.user_id=p.id where p.is_public and s.leaderboard_opt_in
      and (args->>'period'='all' or e.occurred_at>=date_trunc('week',now()))
      and (nullif(args->>'languageId','') is null or e.language_id=(args->>'languageId')::uuid)
      group by p.id order by xp desc,p.username limit 100
    ) r;
    return result;

  elsif action in ('join_room','leave_room','room_feed','send_message') then
    select * into room from public.rooms where id=(args->>'roomId')::uuid and status='published' for update;
    if not found then raise exception 'Room unavailable'; end if;
    if action='leave_room' then delete from public.room_members where room_id=room.id and user_id=uid; return '{}'::jsonb; end if;
    if room.kind not in ('text','study','game') then raise exception 'This room does not support text chat'; end if;
    if action='join_room' then
      if exists(select 1 from public.room_members where room_id=room.id and user_id=uid) then return '{}'::jsonb; end if;
      if (select count(*) from public.room_members where room_id=room.id)>=room.capacity then raise exception 'This room is full'; end if;
      if room.required_level is not null then
        select assessed_level into assessed from public.user_languages where user_id=uid and language_id=room.language_id;
        if coalesce(array_position(array['A1','A2','B1','B2','C1','C2'],assessed),0)<array_position(array['A1','A2','B1','B2','C1','C2'],room.required_level) then raise exception 'Your assessed language level does not meet this room requirement'; end if;
      end if;
      insert into public.room_members(room_id,user_id) values(room.id,uid); return '{}'::jsonb;
    end if;
    if not exists(select 1 from public.room_members where room_id=room.id and user_id=uid) then raise exception 'Join this room first' using errcode='42501'; end if;
    if action='send_message' then
      if char_length(btrim(args->>'body')) not between 1 and 2000 then raise exception 'Messages must contain 1–2000 characters'; end if;
      if exists(select 1 from public.room_messages where user_id=uid and created_at>now()-interval '2 seconds') then raise exception 'Please wait a moment before sending again'; end if;
      insert into public.room_messages(room_id,user_id,body) values(room.id,uid,btrim(args->>'body'));
    end if;
    select coalesce(jsonb_agg(to_jsonb(m) order by m.created_at),'[]') into result from (
      select m.id,m.body,m.created_at,p.display_name,m.user_id=uid as is_mine from public.room_messages m join public.profiles p on p.id=m.user_id where room_id=room.id order by m.created_at desc limit 100
    ) m;
    return result;

  elsif action='generate_material' then
    perform 1 from public.account_progress where user_id=uid for update;
    if (select count(*) from public.generated_materials where user_id=uid and created_at>now()-interval '1 day')>=20 then raise exception 'Daily workbook limit reached'; end if;
    select * into template from public.pdf_templates where id=(args->>'templateId')::uuid and status='published';
    if not found then raise exception 'Template unavailable'; end if;
    select jsonb_agg(to_jsonb(q)) into questions from (
      select e.prompt,e.type,e.payload,s.solution,s.explanation from public.exercises e join private.exercise_solutions s on s.exercise_id=e.id
      join public.lessons l on l.id=e.lesson_id join public.units u on u.id=l.unit_id join public.courses c on c.id=u.course_id join public.languages lang on lang.id=c.language_id
      where e.status='published' and l.status='published' and u.status='published' and c.status='published' and lang.enabled
      and c.language_id=template.language_id and c.level=template.level order by random() limit least(50,greatest(1,coalesce((template.generation_rules->>'questionCount')::integer,10)))
    ) q;
    if questions is null then raise exception 'Publish exercises at this language and level before generating a workbook'; end if;
    insert into public.generated_materials(user_id,template_id,title,status,content)
      values(uid,template.id,template.name,'ready',jsonb_build_object('sections',template.sections,'instructions',template.generation_rules->>'instructions','questions',questions,'source','published-course-bank')) returning id into identity;
    return jsonb_build_object('id',identity);

  elsif action in ('save_exercise','exercise_solution','admin_users') then
    if not private.is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
    if action='admin_users' then
      select coalesce(jsonb_agg(to_jsonb(p)),'[]') into result from (select p.id,p.username,p.display_name,p.created_at,coalesce(r.role,'learner') as role,a.total_xp from public.profiles p left join private.user_roles r on r.user_id=p.id left join public.account_progress a on a.user_id=p.id order by p.created_at desc limit 500) p;
      return result;
    elsif action='exercise_solution' then
      select jsonb_build_object('solution',solution,'explanation',explanation) into result from private.exercise_solutions where exercise_id=(args->>'id')::uuid;
      return coalesce(result,'{}');
    end if;
    question := args->'exercise'; reply := args->'solution';
    if coalesce(question->>'type','') not in ('multiple_choice','typing','translation','word_order','sentence_builder','fill_blank','grammar_choice','true_false') then raise exception 'Unsupported exercise type'; end if;
    if jsonb_typeof(question->'payload') is distinct from 'object' then raise exception 'Exercise payload must be an object'; end if;
    if jsonb_typeof(reply) is distinct from 'object' or octet_length(reply::text)>16384 then raise exception 'An answer key is required'; end if;
    if question->>'type' in ('typing','translation','fill_blank') then
      if jsonb_typeof(reply->'answers') is distinct from 'array' or jsonb_array_length(reply->'answers')=0 then raise exception 'Provide accepted answers as an array'; end if;
      if exists(select 1 from jsonb_array_elements(reply->'answers') a where jsonb_typeof(a)<>'string' or char_length(btrim(a#>>'{}'))=0) then raise exception 'Accepted answers must be nonempty strings'; end if;
    elsif not reply ? 'answer' then raise exception 'Provide an answer'; end if;
    if question->>'type' in ('multiple_choice','grammar_choice','true_false') then
      if jsonb_typeof(question#>'{payload,options}') is distinct from 'array' then raise exception 'Choice exercises need options'; end if;
      if jsonb_array_length(question#>'{payload,options}') not between 2 and 12 or exists(select 1 from jsonb_array_elements(question#>'{payload,options}') o where jsonb_typeof(o->'id') is distinct from 'string' or jsonb_typeof(o->'text') is distinct from 'string' or char_length(btrim(o->>'text'))=0) then raise exception 'Provide 2–12 options with IDs and text'; end if;
      if (select count(distinct o->>'id') from jsonb_array_elements(question#>'{payload,options}') o)<>jsonb_array_length(question#>'{payload,options}') then raise exception 'Option IDs must be unique'; end if;
      if not exists(select 1 from jsonb_array_elements(question#>'{payload,options}') o where o->'id'=reply->'answer') then raise exception 'The correct answer must be an option ID'; end if;
    elsif question->>'type' in ('word_order','sentence_builder') then
      if jsonb_typeof(question#>'{payload,tokens}') is distinct from 'array' or jsonb_typeof(reply->'answer') is distinct from 'array' then raise exception 'Word order requires tokens and an ordered answer array'; end if;
      if jsonb_array_length(reply->'answer') not between 2 and 30 or exists(select 1 from jsonb_array_elements(question#>'{payload,tokens}') t where jsonb_typeof(t)<>'string') then raise exception 'Provide 2–30 word tokens'; end if;
      if (select jsonb_agg(t order by t) from jsonb_array_elements(question#>'{payload,tokens}') t) is distinct from (select jsonb_agg(t order by t) from jsonb_array_elements(reply->'answer') t) then raise exception 'Answer must use each word token exactly once'; end if;
    end if;
    if (question->'payload') ?| array['answer','answers','solution','explanation'] then raise exception 'Keep answers in the private answer key'; end if;
    identity := coalesce(nullif(question->>'id','')::uuid,gen_random_uuid());
    insert into public.exercises(id,lesson_id,position,type,prompt,payload,status) values(identity,(question->>'lesson_id')::uuid,(question->>'position')::int,question->>'type',question->>'prompt',coalesce(question->'payload','{}'),question->>'status')
      on conflict(id) do update set lesson_id=excluded.lesson_id,position=excluded.position,type=excluded.type,prompt=excluded.prompt,payload=excluded.payload,status=excluded.status;
    insert into private.exercise_solutions(exercise_id,solution,explanation) values(identity,reply,coalesce(args->>'explanation',''))
      on conflict(exercise_id) do update set solution=excluded.solution,explanation=excluded.explanation;
    return jsonb_build_object('id',identity);
  end if;
  raise exception 'Unknown platform action';
end $$;
revoke all on function private.platform_action(text,jsonb) from public, anon, authenticated;
grant execute on function private.platform_action(text,jsonb) to authenticated;
create function public.platform_action(p_action text,p_payload jsonb default '{}')
returns jsonb language sql security invoker set search_path='' as $$ select private.platform_action(p_action,p_payload); $$;
revoke all on function public.platform_action(text,jsonb) from public,anon,authenticated;
grant execute on function public.platform_action(text,jsonb) to authenticated;

-- Real locally rendered game engines; no fabricated scores or external downloads.
insert into public.game_releases(game_id,version,platform,status,released_at,metadata)
  select id,'1.0.0','web','published',now(),jsonb_build_object('engine',case slug when 'typing-trails' then 'typing-trails' when 'word-dungeon' then 'word-dungeon' else 'sentence-builder' end,'launchEnabled',true)
  from public.games where slug in ('word-dungeon','typing-trails','grammar-guardian') and status='published'
  on conflict(game_id,platform,version) do nothing;

notify pgrst, 'reload schema';
commit;
