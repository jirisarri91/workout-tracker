-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- Exercise Library
-- ============================================================
create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  instructions text,
  muscle_groups text[] default '{}',
  resources jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- Workout Plans (what is planned for a day)
-- ============================================================
create table if not exists workout_plans (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  name text,
  objective text,
  notes text,
  start_time time,
  end_time time,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- Exercises within a plan (template, no actual data)
-- ============================================================
create table if not exists workout_plan_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_plan_id uuid references workout_plans(id) on delete cascade,
  exercise_id uuid references exercises(id) on delete restrict,
  order_index integer not null default 0,
  sets integer,
  reps integer,
  duration_seconds integer,
  target_weight numeric(6,2),
  rest_seconds integer,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- Actual Workout Sessions (what really happened)
-- ============================================================
create table if not exists workout_sessions (
  id uuid primary key default gen_random_uuid(),
  workout_plan_id uuid references workout_plans(id) on delete set null,
  date date not null unique,
  status text not null default 'planned'
    check (status in ('planned','done','skipped','sport','swim','walk','row')),
  actual_start_time timestamptz,
  actual_end_time timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- Per-exercise record in a session (actual performance)
-- ============================================================
create table if not exists workout_session_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_session_id uuid references workout_sessions(id) on delete cascade,
  workout_plan_exercise_id uuid references workout_plan_exercises(id) on delete set null,
  exercise_id uuid references exercises(id) on delete restrict,
  order_index integer not null default 0,
  status text not null default 'done'
    check (status in ('done','not_done','replaced')),
  replaced_exercise_id uuid references exercises(id) on delete set null,
  sets integer,
  reps integer,
  actual_weight numeric(6,2),
  duration_seconds integer,
  observations text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- User Objectives (single row, upserted)
-- ============================================================
create table if not exists user_objectives (
  id uuid primary key default gen_random_uuid(),
  objective_text text,
  strategy_text text,
  updated_at timestamptz default now()
);

-- ============================================================
-- Disable RLS for single-user personal app
-- ============================================================
alter table exercises disable row level security;
alter table workout_plans disable row level security;
alter table workout_plan_exercises disable row level security;
alter table workout_sessions disable row level security;
alter table workout_session_exercises disable row level security;
alter table user_objectives disable row level security;

-- ============================================================
-- Seed: 20 Common Exercises
-- ============================================================
insert into exercises (name, instructions, muscle_groups, resources) values
(
  'Barbell Back Squat',
  'Stand with feet shoulder-width apart, bar resting on upper traps. Brace core, push hips back, descend until thighs are parallel to floor. Drive through heels to stand.',
  array['Quadriceps','Hamstrings','Glutes','Core'],
  '[{"title":"Squat Tutorial - Alan Thrall","url":"https://www.youtube.com/watch?v=ultWZbUMPL8"}]'
),
(
  'Deadlift',
  'Stand over bar with feet hip-width apart. Hinge at hips, grip bar just outside legs. Brace core, keep back flat, drive through floor to lock out hips.',
  array['Hamstrings','Glutes','Erectors','Lats','Traps'],
  '[{"title":"Deadlift for Beginners - Starting Strength","url":"https://www.youtube.com/watch?v=op9kVnSso6Q"}]'
),
(
  'Bench Press',
  'Lie on bench, grip bar slightly wider than shoulder-width. Lower bar to mid-chest with control, press back up to full extension. Keep wrists straight.',
  array['Chest','Triceps','Front Deltoids'],
  '[{"title":"How to Bench Press - Jeff Nippard","url":"https://www.youtube.com/watch?v=BYKScL2sgCs"}]'
),
(
  'Overhead Press',
  'Stand with bar at shoulder height, grip slightly wider than shoulders. Brace core, press bar overhead in a straight path, lock out elbows at top.',
  array['Shoulders','Triceps','Upper Chest','Core'],
  '[{"title":"Overhead Press - Alan Thrall","url":"https://www.youtube.com/watch?v=2yjwXTZQDDI"}]'
),
(
  'Pull-Up',
  'Hang from bar with overhand grip, hands slightly wider than shoulder-width. Pull chest to bar, keeping elbows pointed down. Lower with control.',
  array['Lats','Biceps','Rear Deltoids','Core'],
  '[{"title":"Pull-Up Tutorial - Calisthenicmovement","url":"https://www.youtube.com/watch?v=eGo4IYlbE5g"}]'
),
(
  'Chin-Up',
  'Hang from bar with underhand grip, hands shoulder-width. Pull chin above bar by driving elbows toward hips. Lower with full extension.',
  array['Biceps','Lats','Core'],
  '[{"title":"Chin-Up vs Pull-Up Explained","url":"https://www.youtube.com/watch?v=B4l6emlGDiA"}]'
),
(
  'Dumbbell Row',
  'Place one knee and hand on bench, hold dumbbell with free hand. Row the weight to your hip, keeping elbow close to body. Squeeze at the top.',
  array['Lats','Rhomboids','Biceps','Rear Deltoids'],
  '[{"title":"Single-Arm DB Row Form","url":"https://www.youtube.com/watch?v=pYcpY20QaE8"}]'
),
(
  'Romanian Deadlift',
  'Hold bar at hip level, feet hip-width. Hinge at hips, pushing them back while lowering bar along legs. Feel hamstring stretch, then drive hips forward to stand.',
  array['Hamstrings','Glutes','Erectors'],
  '[{"title":"RDL Tutorial - Jeremy Ethier","url":"https://www.youtube.com/watch?v=JCXUYuzwNrM"}]'
),
(
  'Leg Press',
  'Sit in machine, place feet shoulder-width on platform. Lower platform until knees are at 90°, press back up without locking knees at top.',
  array['Quadriceps','Hamstrings','Glutes'],
  '[{"title":"Leg Press Guide","url":"https://www.youtube.com/watch?v=GvRgijoJ2xY"}]'
),
(
  'Leg Curl',
  'Lie face down on machine, hook ankles under pad. Curl legs toward glutes, squeeze at top, lower with control.',
  array['Hamstrings'],
  '[{"title":"Lying Leg Curl Tutorial","url":"https://www.youtube.com/watch?v=ELOCsoDSmrg"}]'
),
(
  'Leg Extension',
  'Sit in machine, hook ankles under pad. Extend legs fully, squeeze quads at top, lower with control.',
  array['Quadriceps'],
  '[{"title":"Leg Extension Technique","url":"https://www.youtube.com/watch?v=YyvSfVjQeL0"}]'
),
(
  'Dumbbell Lateral Raise',
  'Stand holding dumbbells at sides. Raise arms out to sides to shoulder height with slight elbow bend. Lower with control.',
  array['Side Deltoids'],
  '[{"title":"Lateral Raise - Jeff Nippard","url":"https://www.youtube.com/watch?v=3VcKaXpzqRo"}]'
),
(
  'Barbell Curl',
  'Stand holding barbell with underhand grip, hands shoulder-width. Curl bar to shoulder height keeping upper arms stationary. Lower fully.',
  array['Biceps','Forearms'],
  '[{"title":"Barbell Curl Form","url":"https://www.youtube.com/watch?v=kwG2ipFRgfo"}]'
),
(
  'Tricep Pushdown',
  'Stand at cable machine with rope or bar attachment. Keep elbows pinned to sides, push attachment down until arms are fully extended.',
  array['Triceps'],
  '[{"title":"Tricep Pushdown Guide","url":"https://www.youtube.com/watch?v=2-LAMcpzODU"}]'
),
(
  'Plank',
  'Get into push-up position with weight on forearms. Keep body in straight line from head to heels. Brace core and glutes. Hold.',
  array['Core','Shoulders'],
  '[{"title":"Perfect Plank Form","url":"https://www.youtube.com/watch?v=pSHjTRCQxIw"}]'
),
(
  'Cable Row',
  'Sit at cable row machine, feet on platform, slight knee bend. Pull handle to lower chest keeping back straight and squeezing shoulder blades.',
  array['Lats','Rhomboids','Biceps','Rear Deltoids'],
  '[{"title":"Seated Cable Row Tutorial","url":"https://www.youtube.com/watch?v=GZbfZ033f74"}]'
),
(
  'Incline Dumbbell Press',
  'Set bench to 30-45°. Hold dumbbells at chest height. Press up and slightly together at top. Lower with control to chest level.',
  array['Upper Chest','Shoulders','Triceps'],
  '[{"title":"Incline DB Press Guide","url":"https://www.youtube.com/watch?v=8iPEnn-ltC8"}]'
),
(
  'Hip Thrust',
  'Sit against bench with bar across hips. Drive through heels to raise hips until body is in straight line. Squeeze glutes at top.',
  array['Glutes','Hamstrings'],
  '[{"title":"Hip Thrust Tutorial - Bret Contreras","url":"https://www.youtube.com/watch?v=SEdqd1n0cvg"}]'
),
(
  'Face Pull',
  'Set cable at face height with rope attachment. Pull rope to face level, separating hands at end of movement. Focus on rear delts and external rotation.',
  array['Rear Deltoids','Rotator Cuff','Upper Traps'],
  '[{"title":"Face Pull - Jeff Cavaliere","url":"https://www.youtube.com/watch?v=rep-qVOkqgk"}]'
),
(
  'Dip',
  'Support yourself on parallel bars with arms extended. Lower body until elbows reach 90°, leaning slightly forward for chest emphasis. Press back up.',
  array['Triceps','Chest','Front Deltoids'],
  '[{"title":"Dips Tutorial - Calisthenicmovement","url":"https://www.youtube.com/watch?v=2z8JmcrW-As"}]'
);
