import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
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

export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  badgeType: text("badge_type").notNull(), // streak_master, century_coder, comeback_coder, weekly_topper
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

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
  earnedAt: true,
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
