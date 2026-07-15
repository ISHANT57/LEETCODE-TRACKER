// Additive-only migration for the goal-profile / category-score feature.
// Deliberately hand-written instead of `drizzle-kit push` because the DB has
// pre-existing drift (legacy week5-35 columns, dashboard_cache table) that
// `push` would try to drop. This script only adds new objects.
import dotenv from "dotenv";
dotenv.config();

import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in environment variables");
}

const sql = neon(process.env.DATABASE_URL);

const statements = [
  `CREATE TABLE IF NOT EXISTS problems (
    title_slug text PRIMARY KEY,
    question_frontend_id text NOT NULL,
    title text NOT NULL,
    difficulty text NOT NULL,
    ac_rate integer NOT NULL DEFAULT 0,
    paid_only boolean NOT NULL DEFAULT false,
    last_catalog_sync_at timestamp DEFAULT now(),
    created_at timestamp DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS problem_tags (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_slug text NOT NULL REFERENCES problems(title_slug),
    tag_slug text NOT NULL,
    tag_name text NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS problem_tags_tag_problem_unique ON problem_tags (tag_slug, problem_slug)`,
  `CREATE INDEX IF NOT EXISTS problem_tags_problem_idx ON problem_tags (problem_slug)`,

  `CREATE TABLE IF NOT EXISTS student_solves (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id varchar NOT NULL REFERENCES students(id),
    problem_slug text NOT NULL REFERENCES problems(title_slug),
    solved_at timestamp NOT NULL,
    quality real DEFAULT 1.0,
    created_at timestamp DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS student_solves_student_problem_unique ON student_solves (student_id, problem_slug)`,

  `CREATE TABLE IF NOT EXISTS student_category_scores (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id varchar NOT NULL REFERENCES students(id),
    category_slug text NOT NULL,
    estimated_score real NOT NULL DEFAULT 0,
    confidence_level real NOT NULL DEFAULT 0,
    adjusted_score real NOT NULL DEFAULT 0,
    evidence_points real NOT NULL DEFAULT 0,
    solve_count integer NOT NULL DEFAULT 0,
    last_solved_at timestamp,
    computed_at timestamp DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS student_category_scores_unique ON student_category_scores (student_id, category_slug)`,

  `CREATE TABLE IF NOT EXISTS goal_profiles (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    kind text NOT NULL,
    owner_student_id varchar REFERENCES students(id),
    created_at timestamp DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS goal_profiles_owner_name_unique ON goal_profiles (owner_student_id, name)`,

  `CREATE TABLE IF NOT EXISTS goal_profile_targets (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_profile_id varchar NOT NULL REFERENCES goal_profiles(id),
    category_slug text NOT NULL,
    weight real NOT NULL DEFAULT 1,
    target_score real NOT NULL DEFAULT 70
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS goal_profile_targets_unique ON goal_profile_targets (goal_profile_id, category_slug)`,

  `ALTER TABLE students ADD COLUMN IF NOT EXISTS selected_goal_profile_id varchar REFERENCES goal_profiles(id)`,
];

for (const [i, stmt] of statements.entries()) {
  const label = stmt.trim().split("\n")[0].slice(0, 80);
  process.stdout.write(`[${i + 1}/${statements.length}] ${label}... `);
  const strings = Object.assign([stmt], { raw: [stmt] });
  await sql(strings);
  console.log("ok");
}

console.log("Migration complete.");
