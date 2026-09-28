-- Development catalog only. All opportunities are explicitly fictional demos.
-- Stable UUID prefixes: 100 languages, 200 learning, 300 avatars, 400 games,
-- 500 characters, 600 rewards, 700 materials, 800 opportunities, 900 rooms.
-- No auth identities, passwords, role grants, AI calls, uploads, or player progress.
begin;

insert into public.languages (id, code, name, native_name, enabled) values
  ('10000000-0000-4000-8000-000000000001', 'ja', 'Japanese', '日本語', true),
  ('10000000-0000-4000-8000-000000000002', 'es', 'Spanish', 'Español', true),
  ('10000000-0000-4000-8000-000000000003', 'de', 'German', 'Deutsch', true),
  ('10000000-0000-4000-8000-000000000004', 'en', 'English', 'English', true)
on conflict (id) do nothing;

insert into public.courses (id, language_id, slug, title, description, level, status) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'japanese-first-conversations', 'First conversations', 'Make your first connections in Japanese, one small conversation at a time.', 'A1', 'published'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'spanish-everyday-encounters', 'Everyday encounters', 'Order a coffee, introduce yourself, and explore a new neighborhood.', 'A1', 'published')
on conflict (id) do nothing;

insert into public.units (id, course_id, title, position, status) values
  ('21000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'A new beginning', 1, 'published'),
  ('21000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'At the café', 1, 'published')
on conflict (id) do nothing;

insert into public.lessons (id, unit_id, title, position, estimated_minutes, xp_reward, status) values
  ('22000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000001', 'Hello, world', 1, 5, 30, 'published'),
  ('22000000-0000-4000-8000-000000000002', '21000000-0000-4000-8000-000000000001', 'Nice to meet you', 2, 7, 35, 'published'),
  ('22000000-0000-4000-8000-000000000003', '21000000-0000-4000-8000-000000000002', 'A coffee, please', 1, 5, 30, 'published')
on conflict (id) do nothing;

insert into public.exercises (id, lesson_id, position, type, prompt, payload, status) values
  ('23000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000001', 1, 'multiple_choice', 'Which greeting means “good morning”?', '{"options":[{"id":"a","text":"おはようございます"},{"id":"b","text":"こんばんは"},{"id":"c","text":"ありがとう"}]}', 'published'),
  ('23000000-0000-4000-8000-000000000002', '22000000-0000-4000-8000-000000000001', 2, 'typing', 'Type the Japanese greeting for “hello” (hiragana).', '{"placeholder":"Type your answer","inputLanguage":"ja"}', 'published'),
  ('23000000-0000-4000-8000-000000000003', '22000000-0000-4000-8000-000000000002', 1, 'multiple_choice', 'How do you introduce yourself for the first time?', '{"options":[{"id":"a","text":"はじめまして"},{"id":"b","text":"おやすみなさい"},{"id":"c","text":"さようなら"}]}', 'published'),
  ('23000000-0000-4000-8000-000000000004', '22000000-0000-4000-8000-000000000003', 1, 'multiple_choice', 'Choose “A coffee, please.”', '{"options":[{"id":"a","text":"Un café, por favor."},{"id":"b","text":"Buenas noches."},{"id":"c","text":"Me llamo Elena."}]}', 'published')
on conflict (id) do nothing;

insert into private.exercise_solutions (exercise_id, solution, explanation) values
  ('23000000-0000-4000-8000-000000000001', '{"optionId":"a"}', 'おはようございます is a polite morning greeting.'),
  ('23000000-0000-4000-8000-000000000002', '{"acceptedAnswers":["こんにちは"],"normalization":"trim_nfc"}', 'こんにちは is a common daytime greeting.'),
  ('23000000-0000-4000-8000-000000000003', '{"optionId":"a"}', 'はじめまして is used when meeting someone for the first time.'),
  ('23000000-0000-4000-8000-000000000004', '{"optionId":"a"}', 'Por favor adds “please” to a request.')
on conflict (exercise_id) do nothing;

insert into public.avatar_assets (id, asset_key, name, category, rarity, is_free, enabled) values
  ('30000000-0000-4000-8000-000000000001', 'body.traveler', 'Traveler base', 'body', 'common', true, true),
  ('30000000-0000-4000-8000-000000000002', 'hair.short-wave', 'Short wave', 'hair', 'common', true, true),
  ('30000000-0000-4000-8000-000000000003', 'top.academy-jacket', 'Academy jacket', 'top', 'common', true, true),
  ('30000000-0000-4000-8000-000000000004', 'accessory.explorer-pin', 'Explorer pin', 'accessory', 'rare', false, true),
  ('30000000-0000-4000-8000-000000000005', 'hair.soft-bob', 'Soft bob', 'hair', 'common', true, true)
on conflict (id) do nothing;

insert into public.avatar_asset_versions (id, asset_id, version, model_family, status, manifest) values
  ('31000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 1, 'humanoid-v1', 'published', '{"schemaVersion":1,"renderers":["2d","placeholder3d"],"platforms":["web"],"assetStatus":"placeholder","defaultTint":"#CFAF94"}'),
  ('31000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 1, 'humanoid-v1', 'published', '{"schemaVersion":1,"renderers":["2d","placeholder3d"],"platforms":["web"],"assetStatus":"placeholder","defaultTint":"#382C29"}'),
  ('31000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', 1, 'humanoid-v1', 'published', '{"schemaVersion":1,"renderers":["2d","placeholder3d"],"platforms":["web"],"assetStatus":"placeholder","defaultTint":"#343D39"}'),
  ('31000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000004', 1, 'universal', 'published', '{"schemaVersion":1,"renderers":["2d"],"platforms":["web"],"assetStatus":"placeholder"}'),
  ('31000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000005', 1, 'humanoid-v1', 'published', '{"schemaVersion":1,"renderers":["2d","placeholder3d"],"platforms":["web"],"assetStatus":"placeholder","defaultTint":"#382C29"}')
on conflict (id) do nothing;

insert into public.games (id, slug, name, description, skills, tags, status) values
  ('40000000-0000-4000-8000-000000000001', 'word-dungeon', 'Word Dungeon', 'Explore a quiet ruin and unlock each door with the right word.', array['vocabulary', 'reading'], array['adventure', 'solo'], 'published'),
  ('40000000-0000-4000-8000-000000000002', 'typing-trails', 'Typing Trails', 'Practice familiar words on a timed journey through the city.', array['writing', 'vocabulary'], array['arcade', 'short-session'], 'published'),
  ('40000000-0000-4000-8000-000000000003', 'grammar-guardian', 'Grammar Guardian', 'Build correct sentences to defend your academy.', array['grammar', 'reading'], array['strategy', 'coming-soon'], 'published')
on conflict (id) do nothing;

insert into public.game_releases (id, game_id, version, platform, status, metadata) values
  ('41000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '0.1.0-preview', 'web', 'published', '{"availability":"preview","languageCodes":["ja","es"],"launchEnabled":false}'),
  ('41000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', '0.1.0-preview', 'web', 'published', '{"availability":"preview","languageCodes":["ja","es","de"],"launchEnabled":false}')
on conflict (id) do nothing;

insert into public.ai_characters (id, slug, name, language_id, biography, city, country, presentation, status) values
  ('50000000-0000-4000-8000-000000000001', 'haruka', 'Haruka', '10000000-0000-4000-8000-000000000001', 'An energetic university student who knows every quiet bookshop in the city.', 'Tokyo', 'JP', '{"personality":["friendly","curious","playful"],"occupation":"University student","renderer":"2d","allowedEmotions":["neutral","happy","thinking"],"allowedPoses":["relaxed","talking"]}', 'published'),
  ('50000000-0000-4000-8000-000000000002', 'mateo', 'Mateo', '10000000-0000-4000-8000-000000000002', 'A patient photographer with a fondness for neighborhood cafés and long stories.', 'Madrid', 'ES', '{"personality":["patient","creative"],"occupation":"Photographer","renderer":"2d","allowedEmotions":["neutral","happy","thinking"]}', 'published')
on conflict (id) do nothing;

insert into public.ai_scenarios (id, character_id, slug, title, objective, level, scene, status) values
  ('51000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', 'convenience-store', 'A small favor', 'Ask where an item is located and thank the clerk.', 'A2', '{"background":"convenience-store","emotion":"happy","pose":"relaxed","camera":"medium_closeup","provider":"mock"}', 'published'),
  ('51000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000002', 'cafe-meeting', 'The corner café', 'Order a drink and introduce yourself.', 'A1', '{"background":"cafe","emotion":"neutral","pose":"relaxed","camera":"medium_closeup","provider":"mock"}', 'published')
on conflict (id) do nothing;

insert into public.achievements (id, slug, title, description, icon, requirement, xp_reward, cosmetic_reward_id, enabled) values
  ('60000000-0000-4000-8000-000000000001', 'first-steps', 'First steps', 'Complete your first lesson.', 'footprint', '{"metric":"lessons_completed","target":1}', 50, null, true),
  ('60000000-0000-4000-8000-000000000002', 'seven-day-explorer', 'Seven-day explorer', 'Meet your daily goal for seven consecutive days.', 'local_fire_department', '{"metric":"current_streak","target":7}', 150, '30000000-0000-4000-8000-000000000004', true)
on conflict (id) do nothing;

insert into public.quests (id, slug, title, kind, requirement, xp_reward, enabled) values
  ('61000000-0000-4000-8000-000000000001', 'daily-lesson', 'Make a little progress', 'daily', '{"metric":"lessons_completed","target":1}', 20, true),
  ('61000000-0000-4000-8000-000000000002', 'daily-words', 'Ten words, new worlds', 'daily', '{"metric":"words_practiced","target":10}', 30, true)
on conflict (id) do nothing;

insert into public.pdf_templates (id, template_key, version, name, language_id, level, sections, generation_rules, status) values
  ('70000000-0000-4000-8000-000000000001', 'japanese-greetings', 1, 'Japanese greetings workbook', '10000000-0000-4000-8000-000000000001', 'A1', '[{"id":"theory","type":"theory","title":"First greetings"},{"id":"examples","type":"examples","count":4},{"id":"practice","type":"fill_blank","count":6},{"id":"answers","type":"answer_sheet"}]', '{"schemaVersion":1,"maxVocabularyItems":12,"includeFurigana":true,"answerBehavior":"separate_answer_sheet","designTemplate":"editorial-v1","provider":"mock"}', 'published')
on conflict (id) do nothing;

insert into public.opportunities (id, slug, title, type, description, country, language_id, required_level, deadline, price_amount, currency, details, is_demo, status) values
  ('80000000-0000-4000-8000-000000000001', 'kyoto-summer-language-demo', 'Kyoto summer language studio', 'language_school', 'Fictional sample: a four-week language and culture program.', 'JP', '10000000-0000-4000-8000-000000000001', 'A2', null, 1800, 'USD', '{"durationWeeks":4,"minimumAge":18,"sampleOnly":true}', true, 'published'),
  ('80000000-0000-4000-8000-000000000002', 'berlin-creative-exchange-demo', 'Berlin creative exchange', 'exchange', 'Fictional sample: language practice through collaborative creative workshops.', 'DE', '10000000-0000-4000-8000-000000000003', 'B1', null, null, null, '{"durationWeeks":8,"sampleOnly":true}', true, 'published'),
  ('80000000-0000-4000-8000-000000000003', 'madrid-language-walk-demo', 'A week of Madrid stories', 'tour', 'Fictional sample: a guided language-learning journey with daily conversation practice.', 'ES', '10000000-0000-4000-8000-000000000002', 'A1', null, 790, 'EUR', '{"durationDays":7,"minimumAge":18,"availability":"preview","itinerary":["Neighborhood introductions","Market conversations","Museum stories"],"sampleOnly":true}', true, 'published')
on conflict (id) do nothing;

insert into public.rooms (id, slug, name, kind, language_id, required_level, capacity, status) values
  ('90000000-0000-4000-8000-000000000001', 'japanese-reading-club', 'Japanese reading club', 'study', '10000000-0000-4000-8000-000000000001', 'A2', 20, 'published'),
  ('90000000-0000-4000-8000-000000000002', 'spanish-cafe', 'Spanish café', 'voice', '10000000-0000-4000-8000-000000000002', 'B1', 12, 'published')
on conflict (id) do nothing;

commit;
