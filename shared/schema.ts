import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, real, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  leetcodeUsername: text("leetcode_username").notNull().unique(),
  leetcodeProfileLink: text("leetcode_profile_link").notNull(),
  profilePhoto: text("profile_photo"), // URL to LeetCode profile photo
  githubUsername: text("github_username"), // GitHub handle; avatar served from https://github.com/<handle>.png
  batch: text("batch").notNull().default("2028"), // "2027" or "2028"
  weeklyGoal: integer("weekly_goal").notNull().default(25), // target problems solved per week
  selectedGoalProfileId: varchar("selected_goal_profile_id").references((): any => goalProfiles.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyProgress = pgTable("daily_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  totalSolved: integer("total_solved").notNull().default(0),
  easySolved: integer("easy_solved").notNull().default(0),
  mediumSolved: integer("medium_solved").notNull().default(0),
  hardSolved: integer("hard_solved").notNull().default(0),
  dailyIncrement: integer("daily_increment").notNull().default(0),
  ranking: integer("ranking").default(0),
  acceptanceRate: integer("acceptance_rate").default(0), // Stored as percentage * 100
  totalSubmissions: integer("total_submissions").default(0),
  totalAccepted: integer("total_accepted").default(0),
  languageStats: jsonb("language_stats").default({}), // Store language-wise submission counts
  createdAt: timestamp("created_at").defaultNow(),
});

export const weeklyTrends = pgTable("weekly_trends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  weekStart: text("week_start").notNull(), // YYYY-MM-DD format
  weekEnd: text("week_end").notNull(),
  totalProblems: integer("total_problems").notNull().default(0),
  weeklyIncrement: integer("weekly_increment").notNull().default(0),
  ranking: integer("ranking").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Badges as awarded by LeetCode itself (matchedUser.badges from LeetCode's
// public GraphQL API) — mirrored locally so the badges page/dashboard don't
// need to hit LeetCode live. No local/custom badge logic here by design.
export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  leetcodeBadgeId: text("leetcode_badge_id").notNull(),
  name: text("name").notNull(), // e.g. "50 Days Badge 2023"
  icon: text("icon").notNull(), // absolute image URL served by LeetCode
  earnedAt: timestamp("earned_at"), // LeetCode's badge creationDate
}, (table) => ({
  studentBadgeUnique: uniqueIndex("badges_student_leetcode_badge_unique").on(table.studentId, table.leetcodeBadgeId),
}));

export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lastSyncTime: timestamp("last_sync_time"),
  isAutoSyncEnabled: boolean("is_auto_sync_enabled").default(true),
});

export const weeklyProgressData = pgTable("weekly_progress_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  week1Score: integer("week1_score").default(0),
  week2Score: integer("week2_score").default(0),
  week3Score: integer("week3_score").default(0),
  week4Score: integer("week4_score").default(0),
  week2Progress: integer("week2_progress").default(0), // W2 - W1
  week3Progress: integer("week3_progress").default(0), // W3 - W2
  week4Progress: integer("week4_progress").default(0), // W4 - W3
  totalScore: integer("total_score").default(0),
  averageWeeklyGrowth: integer("average_weekly_growth").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Real-time LeetCode data from submission calendar
export const leetcodeRealTimeData = pgTable("leetcode_realtime_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  submissionCalendar: text("submission_calendar").notNull().default('{}'), // JSON string from LeetCode
  currentStreak: integer("current_streak").notNull().default(0),
  maxStreak: integer("max_streak").notNull().default(0),
  totalActiveDays: integer("total_active_days").notNull().default(0),
  yearlyActivity: jsonb("yearly_activity").notNull().default([]), // Array of {date, count}
  lastSyncAt: timestamp("last_sync_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Local mirror of LeetCode's public problem catalog (title, difficulty, topic tags),
// used as the "unsolved problems" pool for recommendations.
export const problems = pgTable("problems", {
  titleSlug: text("title_slug").primaryKey(),
  questionFrontendId: text("question_frontend_id").notNull(),
  title: text("title").notNull(),
  difficulty: text("difficulty").notNull(), // "EASY" | "MEDIUM" | "HARD"
  acRate: integer("ac_rate").notNull().default(0), // percentage * 100, matches dailyProgress.acceptanceRate convention
  paidOnly: boolean("paid_only").notNull().default(false),
  lastCatalogSyncAt: timestamp("last_catalog_sync_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const problemTags = pgTable("problem_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  problemSlug: text("problem_slug").references(() => problems.titleSlug).notNull(),
  tagSlug: text("tag_slug").notNull(),
  tagName: text("tag_name").notNull(),
}, (table) => ({
  tagProblemUnique: uniqueIndex("problem_tags_tag_problem_unique").on(table.tagSlug, table.problemSlug),
  problemIdx: index("problem_tags_problem_idx").on(table.problemSlug),
}));

export const studentSolves = pgTable("student_solves", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  problemSlug: text("problem_slug").references(() => problems.titleSlug).notNull(),
  solvedAt: timestamp("solved_at").notNull(),
  quality: real("quality").default(1.0), // future AI-feedback quality hook; unused (always 1.0) today
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  studentProblemUnique: uniqueIndex("student_solves_student_problem_unique").on(table.studentId, table.problemSlug),
}));

export const studentCategoryScores = pgTable("student_category_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  categorySlug: text("category_slug").notNull(),
  estimatedScore: real("estimated_score").notNull().default(0),
  confidenceLevel: real("confidence_level").notNull().default(0),
  adjustedScore: real("adjusted_score").notNull().default(0),
  evidencePoints: real("evidence_points").notNull().default(0),
  solveCount: integer("solve_count").notNull().default(0),
  lastSolvedAt: timestamp("last_solved_at"),
  computedAt: timestamp("computed_at").defaultNow(),
}, (table) => ({
  studentCategoryUnique: uniqueIndex("student_category_scores_unique").on(table.studentId, table.categorySlug),
}));

export const goalProfiles = pgTable("goal_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  kind: text("kind").notNull(), // "builtin" | "custom"
  ownerStudentId: varchar("owner_student_id").references(() => students.id), // null for shared builtins
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  ownerNameUnique: uniqueIndex("goal_profiles_owner_name_unique").on(table.ownerStudentId, table.name),
}));

export const goalProfileTargets = pgTable("goal_profile_targets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  goalProfileId: varchar("goal_profile_id").references(() => goalProfiles.id).notNull(),
  categorySlug: text("category_slug").notNull(),
  weight: real("weight").notNull().default(1),
  targetScore: real("target_score").notNull().default(70),
}, (table) => ({
  profileCategoryUnique: uniqueIndex("goal_profile_targets_unique").on(table.goalProfileId, table.categorySlug),
}));

// Insert schemas
export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
}).extend({
  batch: z.enum(["2027", "2028"]).default("2028"),
});

export const insertDailyProgressSchema = createInsertSchema(dailyProgress).omit({
  id: true,
  createdAt: true,
});

export const insertWeeklyTrendSchema = createInsertSchema(weeklyTrends).omit({
  id: true,
  createdAt: true,
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
});

export const insertWeeklyProgressDataSchema = createInsertSchema(weeklyProgressData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeetcodeRealTimeDataSchema = createInsertSchema(leetcodeRealTimeData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncAt: true,
});

export const insertProblemSchema = createInsertSchema(problems).omit({
  createdAt: true,
  lastCatalogSyncAt: true,
});

export const insertProblemTagSchema = createInsertSchema(problemTags).omit({
  id: true,
});

export const insertStudentSolveSchema = createInsertSchema(studentSolves).omit({
  id: true,
  createdAt: true,
});

export const insertStudentCategoryScoreSchema = createInsertSchema(studentCategoryScores).omit({
  id: true,
  computedAt: true,
});

export const insertGoalProfileSchema = createInsertSchema(goalProfiles).omit({
  id: true,
  createdAt: true,
}).extend({
  kind: z.enum(["builtin", "custom"]),
});

export const insertGoalProfileTargetSchema = createInsertSchema(goalProfileTargets).omit({
  id: true,
});

// Types
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type DailyProgress = typeof dailyProgress.$inferSelect;
export type InsertDailyProgress = z.infer<typeof insertDailyProgressSchema>;

export type WeeklyTrend = typeof weeklyTrends.$inferSelect;
export type InsertWeeklyTrend = z.infer<typeof insertWeeklyTrendSchema>;

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;

export type WeeklyProgressData = typeof weeklyProgressData.$inferSelect;
export type InsertWeeklyProgressData = z.infer<typeof insertWeeklyProgressDataSchema>;

export type LeetcodeRealTimeData = typeof leetcodeRealTimeData.$inferSelect;
export type InsertLeetcodeRealTimeData = z.infer<typeof insertLeetcodeRealTimeDataSchema>;

export type AppSettings = typeof appSettings.$inferSelect;

export type Problem = typeof problems.$inferSelect;
export type InsertProblem = z.infer<typeof insertProblemSchema>;

export type ProblemTag = typeof problemTags.$inferSelect;
export type InsertProblemTag = z.infer<typeof insertProblemTagSchema>;

export type StudentSolve = typeof studentSolves.$inferSelect;
export type InsertStudentSolve = z.infer<typeof insertStudentSolveSchema>;

export type StudentCategoryScore = typeof studentCategoryScores.$inferSelect;
export type InsertStudentCategoryScore = z.infer<typeof insertStudentCategoryScoreSchema>;

export type GoalProfile = typeof goalProfiles.$inferSelect;
export type InsertGoalProfile = z.infer<typeof insertGoalProfileSchema>;

export type GoalProfileTarget = typeof goalProfileTargets.$inferSelect;
export type InsertGoalProfileTarget = z.infer<typeof insertGoalProfileTargetSchema>;

// API Response types
export interface LeetCodeStats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  acceptanceRate: number;
  ranking: number;
  totalSubmissions: number;
  totalAccepted: number;
  languageStats: Record<string, number>;
}

export interface RecommendedProblem {
  titleSlug: string;
  title: string;
  difficulty: string;
  acRate: number;
  categorySlug: string;
  categoryLabel: string;
  daysSinceSolved?: number;
}

export interface CategoryScoreSummary {
  categorySlug: string;
  categoryLabel: string;
  estimatedScore: number;
  confidenceLevel: number;
  adjustedScore: number;
  evidencePoints: number;
  solveCount: number;
  lastSolvedAt: string | null;
}

export interface RecentSubmission {
  problemSlug: string;
  problemTitle: string;
  difficulty: string;
  solvedAt: string;
}

export interface GoalProfileProgress {
  id: string;
  name: string;
  kind: "builtin" | "custom";
  overallProgress: number;
  targets: {
    categorySlug: string;
    categoryLabel: string;
    weight: number;
    targetScore: number;
    currentScore: number;
  }[];
}

export interface StudentDashboardData {
  student: Student;
  stats: LeetCodeStats;
  currentStreak: number;
  maxStreak: number;
  totalActiveDays: number;
  weeklyRank: number;
  batchRank: number;
  universityRank: number;
  batchSize: number;
  universitySize: number;
  badges: Badge[];
  weeklyProgress: number[];
  // Problems solved so far in the current week (for goal tracking).
  currentWeeklyProgress: number;
  dailyActivity: { date: string; count: number }[];
  yearlyActivity: { date: string; count: number }[];
  // Cumulative solved counts per difficulty over time (oldest -> newest),
  // used to render the "progress over time" difficulty trend chart.
  difficultyHistory: {
    date: string;
    easy: number;
    medium: number;
    hard: number;
    total: number;
  }[];
  categoryScores: CategoryScoreSummary[];
  recommendations: {
    fundamental: RecommendedProblem[];
    refresh: RecommendedProblem[];
    new: RecommendedProblem[];
  };
  goalProfile: GoalProfileProgress | null;
  recentSubmissions: RecentSubmission[];
}

export interface AdminDashboardData {
  totalStudents: number;
  activeStudents: number;
  avgProblems: number;
  underperforming: number;
  maxStreakOverall: number;
  avgMaxStreak: number;
  students: (Student & {
    stats: LeetCodeStats;
    weeklyProgress: number;
    streak: number;
    maxStreak: number;
    totalActiveDays: number;
    status: string;
    weakestCategory: { categorySlug: string; categoryLabel: string; adjustedScore: number } | null;
  })[];
  leaderboard: {
    rank: number;
    student: Student;
    weeklyScore: number;
  }[];
}

export interface BatchDashboardData {
  batch: string;
  totalStudents: number;
  activeStudents: number;
  avgProblems: number;
  underperforming: number;
  maxStreakOverall: number;
  avgMaxStreak: number;
  students: (Student & {
    stats: LeetCodeStats;
    weeklyProgress: number;
    streak: number;
    maxStreak: number;
    totalActiveDays: number;
    status: string;
    weakestCategory: { categorySlug: string; categoryLabel: string; adjustedScore: number } | null;
  })[];
  leaderboard: {
    rank: number;
    student: Student;
    weeklyScore: number;
  }[];
}

export interface UniversityDashboardData {
  batch2027: BatchDashboardData;
  batch2028: BatchDashboardData;
  combined: {
    totalStudents: number;
    activeStudents: number;
    avgProblems: number;
    underperforming: number;
    maxStreakOverall: number;
    avgMaxStreak: number;
    universityLeaderboard: {
      rank: number;
      student: Student;
      totalSolved: number;
      batch: string;
    }[];
  };
}
