// Reshapes the `badges` table from the old custom/local badge system
// (badge_type, title, description) to mirror LeetCode's own badges
// (leetcode_badge_id, name, icon URL, earnedAt = LeetCode's creationDate).
//
// This intentionally clears existing rows: the old custom badges
// (streak_master, century_coder, ...) have no equivalent under the new
// model, so there is nothing meaningful to carry forward. Real badges
// repopulate automatically on the next sync via LeetCodeService.
//
// Hand-written instead of `drizzle-kit push` because the DB has unrelated
// pre-existing drift (legacy week5-35 columns, dashboard_cache table) that
// `push` would try to drop — see migrate-goal-profiles.mjs.
import dotenv from "dotenv";
dotenv.config();

import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in environment variables");
}

const sql = neon(process.env.DATABASE_URL);

const statements = [
  `TRUNCATE TABLE badges`,
  `ALTER TABLE badges DROP COLUMN IF EXISTS badge_type`,
  `ALTER TABLE badges DROP COLUMN IF EXISTS title`,
  `ALTER TABLE badges DROP COLUMN IF EXISTS description`,
  `ALTER TABLE badges ADD COLUMN IF NOT EXISTS leetcode_badge_id text NOT NULL`,
  `ALTER TABLE badges ADD COLUMN IF NOT EXISTS name text NOT NULL`,
  `ALTER TABLE badges ALTER COLUMN earned_at DROP DEFAULT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS badges_student_leetcode_badge_unique ON badges (student_id, leetcode_badge_id)`,
];

for (const [i, stmt] of statements.entries()) {
  const label = stmt.trim().split("\n")[0].slice(0, 80);
  process.stdout.write(`[${i + 1}/${statements.length}] ${label}... `);
  const strings = Object.assign([stmt], { raw: [stmt] });
  await sql(strings);
  console.log("ok");
}

console.log("Migration complete.");
