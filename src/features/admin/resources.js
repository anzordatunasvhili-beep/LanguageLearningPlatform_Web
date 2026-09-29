const text = (key, label, extra = {}) => ({ key, label, type: 'text', ...extra });
const number = (key, label, extra = {}) => ({ key, label, type: 'number', ...extra });
const select = (key, label, options, extra = {}) => ({
  key,
  label,
  type: 'select',
  options,
  ...extra,
});
const relation = (key, label, table, display = 'name', extra = {}) => ({
  key,
  label,
  type: 'relation',
  table,
  display,
  ...extra,
});
const json = (key, label, value) => ({ key, label, type: 'json', default: value });
const status = select('status', 'Publication status', ['draft', 'published', 'archived'], {
  default: 'draft',
});
const language = relation('language_id', 'Language', 'languages');
const level = select('level', 'CEFR level', ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], {
  default: 'A1',
});
const enabled = { key: 'enabled', label: 'Enabled', type: 'checkbox', default: false };
const slug = text('slug', 'URL slug', {
  pattern: '[a-z0-9-]+',
  help: 'Lowercase letters, numbers, and hyphens.',
});
const description = { key: 'description', label: 'Description', type: 'textarea', default: '' };
const requirement = json('requirement', 'Requirement', { metric: 'lessons_completed', target: 1 });
export const adminResources = {
  languages: {
    table: 'languages',
    title: 'Languages',
    display: 'name',
    fields: [
      text('code', 'Language code'),
      text('name', 'Name'),
      text('native_name', 'Native name'),
      enabled,
    ],
  },
  courses: {
    table: 'courses',
    title: 'Courses',
    display: 'title',
    fields: [language, slug, text('title', 'Title'), description, level, status],
  },
  units: {
    table: 'units',
    title: 'Units',
    display: 'title',
    fields: [
      relation('course_id', 'Course', 'courses', 'title'),
      text('title', 'Title'),
      number('position', 'Order', { default: 1, min: 0 }),
      status,
    ],
  },
  lessons: {
    table: 'lessons',
    title: 'Lessons',
    display: 'title',
    fields: [
      relation('unit_id', 'Unit', 'units', 'title'),
      text('title', 'Title'),
      number('position', 'Order', { default: 1, min: 0 }),
      number('estimated_minutes', 'Estimated minutes', { default: 5, min: 1, max: 240 }),
      number('xp_reward', 'First-completion XP', { default: 20, min: 0, max: 10000 }),
      number('content_version', 'Content version', { default: 1, min: 1 }),
      status,
    ],
  },
  exercises: {
    table: 'exercises',
    title: 'Exercises',
    display: 'prompt',
    fields: [
      relation('lesson_id', 'Lesson', 'lessons', 'title'),
      number('position', 'Order', { default: 1, min: 0 }),
      select(
        'type',
        'Exercise type',
        [
          'multiple_choice',
          'typing',
          'word_order',
          'translation',
          'fill_blank',
          'grammar_choice',
          'sentence_builder',
        ],
        { default: 'multiple_choice' },
      ),
      text('prompt', 'Question'),
      json('payload', 'Question content', {
        options: [
          { id: 'a', text: 'First option' },
          { id: 'b', text: 'Second option' },
        ],
      }),
      status,
    ],
    help: 'Choice payload: options with id/text. Typing payload may contain a hint. Word order payload needs tokens. Answers are stored privately. Never place answers inside the question content.',
  },
  games: {
    table: 'games',
    title: 'Games',
    display: 'name',
    fields: [
      slug,
      text('name', 'Name'),
      description,
      json('skills', 'Skills', ['vocabulary']),
      json('tags', 'Tags', []),
      status,
    ],
  },
  'game-releases': {
    table: 'game_releases',
    title: 'Game releases',
    display: 'version',
    fields: [
      relation('game_id', 'Game', 'games'),
      text('version', 'Version', { default: '1.0.0' }),
      select(
        'platform',
        'Platform',
        ['web', 'android', 'ios', 'windows', 'macos', 'linux', 'godot'],
        { default: 'web' },
      ),
      number('minimum_level', 'Minimum account level', { default: 1, min: 1 }),
      text('download_url', 'External download URL', { optional: true, type: 'url' }),
      json('metadata', 'Engine configuration', { engine: 'word-dungeon', launchEnabled: true }),
      status,
    ],
    help: 'Web engines: word-dungeon, typing-trails, sentence-builder. They run published lesson challenges. External platforms require a real HTTPS download URL.',
  },
  characters: {
    table: 'ai_characters',
    title: 'Characters',
    display: 'name',
    fields: [
      slug,
      text('name', 'Name'),
      language,
      { key: 'biography', label: 'Biography', type: 'textarea' },
      text('city', 'City', { optional: true }),
      text('country', 'Country code', { optional: true, maxLength: 2 }),
      json('presentation', 'Personality and appearance', {
        occupation: 'Conversation partner',
        personality: ['friendly'],
        appearance: { skin: '#deb99e', hair: '#343735', outfit: '#747e69', style: 'bob' },
      }),
      status,
    ],
  },
  scenarios: {
    table: 'ai_scenarios',
    title: 'Conversation scenarios',
    display: 'title',
    fields: [
      relation('character_id', 'Character', 'ai_characters'),
      slug,
      text('title', 'Title'),
      { key: 'objective', label: 'Learning objective', type: 'textarea' },
      level,
      json('scene', 'Scene', { background: 'cafe', emotion: 'neutral' }),
      status,
    ],
  },
  'avatar-assets': {
    table: 'avatar_assets',
    title: 'Avatar assets',
    display: 'name',
    fields: [
      text('asset_key', 'Stable asset key'),
      text('name', 'Name'),
      select('category', 'Slot', [
        'body',
        'face',
        'hair',
        'eyes',
        'top',
        'bottom',
        'shoes',
        'outerwear',
        'accessory',
      ]),
      select('rarity', 'Rarity', ['common', 'uncommon', 'rare', 'epic', 'legendary'], {
        default: 'common',
      }),
      { key: 'is_free', label: 'Free for every learner', type: 'checkbox', default: true },
      enabled,
    ],
  },
  'avatar-versions': {
    table: 'avatar_asset_versions',
    title: 'Avatar asset versions',
    display: 'version',
    versioned: true,
    fields: [
      relation('asset_id', 'Asset', 'avatar_assets'),
      number('version', 'Version', { default: 1, min: 1 }),
      text('model_family', 'Model family', { default: 'humanoid-v1' }),
      text('preview_path', 'Preview storage path', { optional: true }),
      json('manifest', 'Renderer manifest', {
        schemaVersion: 1,
        platforms: ['web'],
        renderers: ['2d'],
      }),
      status,
    ],
  },
  achievements: {
    table: 'achievements',
    title: 'Achievements',
    display: 'title',
    fields: [
      slug,
      text('title', 'Title'),
      description,
      text('icon', 'Material Symbol', { default: 'emoji_events' }),
      requirement,
      number('xp_reward', 'XP reward', { default: 50, min: 0, max: 10000 }),
      relation('cosmetic_reward_id', 'Cosmetic reward', 'avatar_assets', 'name', {
        optional: true,
      }),
      enabled,
    ],
    help: 'Supported metrics: lessons_completed, current_streak, games_completed. Target must be a positive integer.',
  },
  quests: {
    table: 'quests',
    title: 'Quests',
    display: 'title',
    fields: [
      slug,
      text('title', 'Title'),
      select('kind', 'Schedule', ['daily', 'weekly'], { default: 'daily' }),
      requirement,
      number('xp_reward', 'XP reward', { default: 20, min: 0, max: 10000 }),
      enabled,
    ],
    help: 'Supported metrics: lessons_completed, words_practiced, games_completed. Target must be a positive integer.',
  },
  opportunities: {
    table: 'opportunities',
    title: 'Opportunities',
    display: 'title',
    fields: [
      slug,
      text('title', 'Title'),
      select('type', 'Program type', [
        'university',
        'internship',
        'scholarship',
        'study_abroad',
        'language_school',
        'exam',
        'exchange',
        'tour',
        'camp',
      ]),
      description,
      text('country', 'Country code', { maxLength: 2, optional: true }),
      { ...language, optional: true },
      select('required_level', 'Required proficiency', ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], {
        optional: true,
      }),
      { key: 'deadline', label: 'Deadline', type: 'date', optional: true },
      number('price_amount', 'Price', { optional: true, min: 0, step: '0.01' }),
      text('currency', 'Currency code', { optional: true, maxLength: 3 }),
      select('delivery', 'Delivery', ['online', 'in_person', 'hybrid'], { default: 'in_person' }),
      text('source_url', 'Application / official website', { type: 'url', optional: true }),
      json('details', 'Additional details', { itinerary: [] }),
      {
        key: 'is_demo',
        label: 'Fictional example (hidden from learners)',
        type: 'checkbox',
        default: false,
      },
      status,
    ],
  },
  rooms: {
    table: 'rooms',
    title: 'Study rooms',
    display: 'name',
    fields: [
      slug,
      text('name', 'Name'),
      select('kind', 'Room kind', ['text', 'study', 'game'], { default: 'study' }),
      { ...language, optional: true },
      select('required_level', 'Minimum assessed level', ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], {
        optional: true,
      }),
      number('capacity', 'Capacity', { default: 20, min: 2, max: 1000 }),
      status,
    ],
    help: 'Leave the assessed-level requirement empty for rooms open to new learners.',
  },
  'pdf-templates': {
    table: 'pdf_templates',
    title: 'Workbook templates',
    display: 'name',
    versioned: true,
    fields: [
      text('template_key', 'Stable template key'),
      number('version', 'Version', { default: 1, min: 1 }),
      text('name', 'Name'),
      language,
      level,
      json('sections', 'Sections', [
        { id: 'practice', type: 'practice', title: 'Practice' },
        { id: 'answers', type: 'answer_sheet', title: 'Answer sheet' },
      ]),
      json('generation_rules', 'Workbook rules', {
        questionCount: 10,
        instructions: 'Complete the questions, then review your answers.',
        answerBehavior: 'separate_answer_sheet',
      }),
      status,
    ],
    help: 'Workbooks select actual published exercises at this language and level. Published templates are immutable; create a new version to change their structure.',
  },
  reports: {
    table: 'moderation_reports',
    title: 'Moderation reports',
    display: 'reason',
    existingOnly: true,
    fields: [select('status', 'Status', ['open', 'reviewing', 'resolved', 'dismissed'])],
  },
};
