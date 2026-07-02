
import { 
  type Student, 
  type InsertStudent,
  type DailyProgress,
  type InsertDailyProgress,
  type WeeklyTrend,
  type InsertWeeklyTrend,
  type Badge,
  type InsertBadge,
  type AppSettings,
  type WeeklyProgressData,
  type InsertWeeklyProgressData,
  type LeetcodeRealTimeData,
  type InsertLeetcodeRealTimeData,
  type LeetCodeStats,
  type StudentDashboardData,
  type AdminDashboardData,
  type BatchDashboardData,
  type UniversityDashboardData,
  students,
  dailyProgress,
  weeklyTrends,
  badges,
  appSettings,
  weeklyProgressData,
  leetcodeRealTimeData
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  // Students
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByUsername(username: string): Promise<Student | undefined>;
  getAllStudents(): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, updates: Partial<Student>): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<boolean>;
  deleteStudentByUsername(username: string): Promise<boolean>;

  // Daily Progress
  getDailyProgress(studentId: string, date: string): Promise<DailyProgress | undefined>;
  getStudentDailyProgress(studentId: string, days?: number): Promise<DailyProgress[]>;
  createDailyProgress(progress: InsertDailyProgress): Promise<DailyProgress>;
  updateDailyProgress(studentId: string, date: string, updates: Partial<DailyProgress>): Promise<DailyProgress | undefined>;
  deleteDailyProgress(studentId: string, date: string): Promise<boolean>;

  // Weekly Trends
  getWeeklyTrends(studentId: string, weeks?: number): Promise<WeeklyTrend[]>;
  createWeeklyTrend(trend: InsertWeeklyTrend): Promise<WeeklyTrend>;
  getCurrentWeekTrend(studentId: string): Promise<WeeklyTrend | undefined>;
  deleteWeeklyTrend(studentId: string, weekStart: string): Promise<boolean>;

  // Weekly Progress Data
  getWeeklyProgressData(studentId: string): Promise<WeeklyProgressData | undefined>;
  getAllWeeklyProgressData(): Promise<WeeklyProgressData[]>;
  createWeeklyProgressData(data: InsertWeeklyProgressData): Promise<WeeklyProgressData>;
  updateWeeklyProgressData(studentId: string, updates: Partial<WeeklyProgressData>): Promise<WeeklyProgressData | undefined>;
  deleteWeeklyProgressData(studentId: string): Promise<boolean>;

  // LeetCode Real-time Data
  getLeetcodeRealTimeData(studentId: string): Promise<LeetcodeRealTimeData | undefined>;
  createLeetcodeRealTimeData(data: InsertLeetcodeRealTimeData): Promise<LeetcodeRealTimeData>;
  updateLeetcodeRealTimeData(studentId: string, updates: Partial<LeetcodeRealTimeData>): Promise<LeetcodeRealTimeData | undefined>;
  deleteLeetcodeRealTimeData(studentId: string): Promise<boolean>;

  // Badges
  getStudentBadges(studentId: string): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  getBadgeByType(studentId: string, badgeType: string): Promise<Badge | undefined>;
  getAllBadgesData(): Promise<any>;

  // App Settings
  getAppSettings(): Promise<AppSettings | undefined>;
  updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings>;

  // Dashboard data
  getStudentDashboard(studentId: string): Promise<StudentDashboardData | undefined>;
  getAdminDashboard(): Promise<AdminDashboardData>;
  getBatchDashboard(batch: string): Promise<BatchDashboardData>;
  getUniversityDashboard(): Promise<UniversityDashboardData>;
  getLeaderboard(): Promise<Array<{ rank: number; student: Student; weeklyScore: number }>>;
  getBatchLeaderboard(batch: string): Promise<Array<{ rank: number; student: Student; weeklyScore: number }>>;
  getUniversityLeaderboard(): Promise<Array<{ rank: number; student: Student; totalSolved: number; batch: string }>>;

  // Batch-specific methods
  getStudentsByBatch(batch: string): Promise<Student[]>;
  getAllStudentsWithBatch(): Promise<Student[]>;

  // Helper methods
  hasStudentEarnedBadge(studentId: string, badgeType: string): Promise<boolean>;
  calculateStreak(studentId: string): Promise<number>;
  calculateMaxStreak(studentId: string): Promise<number>;
  calculateTotalActiveDays(studentId: string): Promise<number>;
  getWeeklyTrend(studentId: string, weekStart: string): Promise<WeeklyTrend | undefined>;
  getLatestDailyProgress(studentId: string): Promise<DailyProgress | undefined>;
}

export class PostgreSQLStorage implements IStorage {
  // Students
  async getStudent(id: string): Promise<Student | undefined> {
    const result = await db.select().from(students).where(eq(students.id, id)).limit(1);
    return result[0];
  }

  async getStudentByUsername(username: string): Promise<Student | undefined> {
    const result = await db.select().from(students).where(eq(students.leetcodeUsername, username)).limit(1);
    return result[0];
  }

  async getAllStudents(): Promise<Student[]> {
    return await db.select().from(students);
  }

  // ------------------------------------------------------------------
  // Bulk-fetch helpers to avoid N+1 queries.
  // The Neon serverless HTTP driver issues one round-trip per query, so
  // per-student loops used to fire hundreds of requests and made the
  // dashboards load very slowly. These pull everything in a few queries
  // and group in memory instead.
  // ------------------------------------------------------------------

  // Map of studentId -> daily progress rows, newest first.
  private async getAllDailyProgressByStudent(): Promise<Map<string, DailyProgress[]>> {
    const all = await db.select().from(dailyProgress).orderBy(desc(dailyProgress.date));
    const map = new Map<string, DailyProgress[]>();
    for (const p of all) {
      const arr = map.get(p.studentId);
      if (arr) arr.push(p);
      else map.set(p.studentId, [p]);
    }
    return map;
  }

  private async getAllRealTimeDataByStudent(): Promise<Map<string, LeetcodeRealTimeData>> {
    const all = await db.select().from(leetcodeRealTimeData);
    const map = new Map<string, LeetcodeRealTimeData>();
    for (const r of all) map.set(r.studentId, r);
    return map;
  }

  private async getAllWeeklyProgressDataByStudent(): Promise<Map<string, WeeklyProgressData>> {
    const all = await db.select().from(weeklyProgressData);
    const map = new Map<string, WeeklyProgressData>();
    for (const w of all) map.set(w.studentId, w);
    return map;
  }

  // Public grouped accessors used by analytics.
  async getAllDailyProgressGrouped(): Promise<Map<string, DailyProgress[]>> {
    return this.getAllDailyProgressByStudent();
  }

  async getAllWeeklyTrendsGrouped(): Promise<Map<string, WeeklyTrend[]>> {
    const all = await db.select().from(weeklyTrends).orderBy(desc(weeklyTrends.weekStart));
    const map = new Map<string, WeeklyTrend[]>();
    for (const t of all) {
      const arr = map.get(t.studentId);
      if (arr) arr.push(t);
      else map.set(t.studentId, [t]);
    }
    return map;
  }

  // In-memory streak/activity computations over a student's daily rows
  // (array must be newest-first, matching getAllDailyProgressByStudent).
  private streakFromArray(arr: DailyProgress[]): number {
    let streak = 0;
    for (const p of arr) {
      if (p.dailyIncrement > 0) streak++;
      else break;
    }
    return streak;
  }

  private maxStreakFromArray(arr: DailyProgress[]): number {
    let max = 0;
    let cur = 0;
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i].dailyIncrement > 0) {
        cur++;
        max = Math.max(max, cur);
      } else {
        cur = 0;
      }
    }
    return max;
  }

  private activeDaysFromArray(arr: DailyProgress[]): number {
    return arr.filter(p => p.dailyIncrement > 0).length;
  }

  private emptyStats(): LeetCodeStats {
    return {
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      acceptanceRate: 0,
      ranking: 0,
      totalSubmissions: 0,
      totalAccepted: 0,
      languageStats: {} as Record<string, number>,
    };
  }

  private statsFromProgress(latestProgress: DailyProgress | undefined): LeetCodeStats {
    if (!latestProgress) return this.emptyStats();
    return {
      totalSolved: latestProgress.totalSolved,
      easySolved: latestProgress.easySolved,
      mediumSolved: latestProgress.mediumSolved,
      hardSolved: latestProgress.hardSolved,
      acceptanceRate: latestProgress.acceptanceRate || 0,
      ranking: latestProgress.ranking || 0,
      totalSubmissions: latestProgress.totalSubmissions || 0,
      totalAccepted: latestProgress.totalAccepted || 0,
      languageStats: (latestProgress.languageStats as Record<string, number>) || {} as Record<string, number>,
    };
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const result = await db.insert(students).values(insertStudent).returning();
    return result[0];
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student | undefined> {
    const result = await db.update(students).set(updates).where(eq(students.id, id)).returning();
    return result[0];
  }

  async deleteStudent(id: string): Promise<boolean> {
    try {
      // First delete all related data
      await db.delete(badges).where(eq(badges.studentId, id));
      await db.delete(weeklyTrends).where(eq(weeklyTrends.studentId, id));
      await db.delete(dailyProgress).where(eq(dailyProgress.studentId, id));
      await db.delete(leetcodeRealTimeData).where(eq(leetcodeRealTimeData.studentId, id));
      await db.delete(weeklyProgressData).where(eq(weeklyProgressData.studentId, id));
      
      // Then delete the student
      const result = await db.delete(students).where(eq(students.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting student:', error);
      return false;
    }
  }

  async deleteStudentByUsername(username: string): Promise<boolean> {
    try {
      const student = await this.getStudentByUsername(username);
      if (!student) return false;
      
      return await this.deleteStudent(student.id);
    } catch (error) {
      console.error('Error deleting student by username:', error);
      return false;
    }
  }

  // Daily Progress
  async getDailyProgress(studentId: string, date: string): Promise<DailyProgress | undefined> {
    const result = await db.select().from(dailyProgress)
      .where(and(eq(dailyProgress.studentId, studentId), eq(dailyProgress.date, date)))
      .limit(1);
    return result[0];
  }

  async getStudentDailyProgress(studentId: string, days = 30): Promise<DailyProgress[]> {
    return await db.select().from(dailyProgress)
      .where(eq(dailyProgress.studentId, studentId))
      .orderBy(desc(dailyProgress.date))
      .limit(days);
  }

  async createDailyProgress(insertProgress: InsertDailyProgress): Promise<DailyProgress> {
    const result = await db.insert(dailyProgress).values(insertProgress).returning();
    return result[0];
  }

  async updateDailyProgress(studentId: string, date: string, updates: Partial<DailyProgress>): Promise<DailyProgress | undefined> {
    const result = await db.update(dailyProgress)
      .set(updates)
      .where(and(eq(dailyProgress.studentId, studentId), eq(dailyProgress.date, date)))
      .returning();
    return result[0];
  }

  // Weekly Trends
  async getWeeklyTrends(studentId: string, weeks = 12): Promise<WeeklyTrend[]> {
    return await db.select().from(weeklyTrends)
      .where(eq(weeklyTrends.studentId, studentId))
      .orderBy(desc(weeklyTrends.weekStart))
      .limit(weeks);
  }

  async createWeeklyTrend(insertTrend: InsertWeeklyTrend): Promise<WeeklyTrend> {
    const result = await db.insert(weeklyTrends).values(insertTrend).returning();
    return result[0];
  }

  async getCurrentWeekTrend(studentId: string): Promise<WeeklyTrend | undefined> {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekStart = startOfWeek.toISOString().split('T')[0];
    
    const result = await db.select().from(weeklyTrends)
      .where(and(eq(weeklyTrends.studentId, studentId), eq(weeklyTrends.weekStart, weekStart)))
      .limit(1);
    return result[0];
  }

  async deleteWeeklyTrend(studentId: string, weekStart: string): Promise<boolean> {
    try {
      await db.delete(weeklyTrends)
        .where(and(eq(weeklyTrends.studentId, studentId), eq(weeklyTrends.weekStart, weekStart)));
      return true;
    } catch (error) {
      console.error('Error deleting weekly trend:', error);
      return false;
    }
  }

  async deleteDailyProgress(studentId: string, date: string): Promise<boolean> {
    try {
      await db.delete(dailyProgress)
        .where(and(eq(dailyProgress.studentId, studentId), eq(dailyProgress.date, date)));
      return true;
    } catch (error) {
      console.error('Error deleting daily progress:', error);
      return false;
    }
  }

  // Badges
  async getStudentBadges(studentId: string): Promise<Badge[]> {
    return await db.select().from(badges)
      .where(eq(badges.studentId, studentId))
      .orderBy(desc(badges.earnedAt));
  }

  async createBadge(insertBadge: InsertBadge): Promise<Badge> {
    const result = await db.insert(badges).values(insertBadge).returning();
    return result[0];
  }

  async getBadgeByType(studentId: string, badgeType: string): Promise<Badge | undefined> {
    const result = await db.select().from(badges)
      .where(and(eq(badges.studentId, studentId), eq(badges.badgeType, badgeType)))
      .limit(1);
    return result[0];
  }

  async getAllBadgesData(): Promise<any> {
    // Get all badges with student information
    const allBadges = await db.select({
      id: badges.id,
      studentId: badges.studentId,
      badgeType: badges.badgeType,
      title: badges.title,
      description: badges.description,
      icon: badges.icon,
      earnedAt: badges.earnedAt,
      studentName: students.name,
      studentUsername: students.leetcodeUsername
    })
    .from(badges)
    .innerJoin(students, eq(badges.studentId, students.id))
    .orderBy(desc(badges.earnedAt));

    // Transform badges to include student info
    const badgesWithStudents = allBadges.map(badge => ({
      id: badge.id,
      studentId: badge.studentId,
      badgeType: badge.badgeType,
      title: badge.title,
      description: badge.description,
      icon: badge.icon,
      earnedAt: badge.earnedAt,
      student: {
        id: badge.studentId,
        name: badge.studentName,
        leetcodeUsername: badge.studentUsername
      }
    }));

    // Calculate badge statistics
    const totalBadges = allBadges.length;
    const uniqueRecipients = new Set(allBadges.map(b => b.studentId)).size;
    
    // Find most popular badge type
    const badgeTypeCounts = allBadges.reduce((counts, badge) => {
      counts[badge.badgeType] = (counts[badge.badgeType] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const mostPopularBadge = Object.keys(badgeTypeCounts).reduce((a, b) => 
      badgeTypeCounts[a] > badgeTypeCounts[b] ? a : b, Object.keys(badgeTypeCounts)[0] || ''
    );

    // Get recent badges (last 10)
    const recentBadges = badgesWithStudents.slice(0, 10);

    return {
      allBadges: badgesWithStudents,
      badgeStats: {
        totalBadges,
        totalRecipients: uniqueRecipients,
        mostPopularBadge,
        recentBadges
      }
    };
  }

  // App Settings
  async getAppSettings(): Promise<AppSettings | undefined> {
    const result = await db.select().from(appSettings).limit(1);
    return result[0];
  }

  async updateAppSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    // Try to update first, if no rows affected, insert
    const existing = await this.getAppSettings();
    if (existing) {
      const result = await db.update(appSettings).set(updates).where(eq(appSettings.id, existing.id)).returning();
      return result[0];
    } else {
      const result = await db.insert(appSettings).values(updates as any).returning();
      return result[0];
    }
  }

  // Dashboard methods
  async getStudentDashboard(studentId: string): Promise<StudentDashboardData | undefined> {
    const student = await this.getStudent(studentId);
    if (!student) return undefined;

    const [dailyProgress, badges, weeklyTrends, realTimeData] = await Promise.all([
      this.getStudentDailyProgress(studentId, 30),
      this.getStudentBadges(studentId),
      this.getWeeklyTrends(studentId, 12),
      this.getLeetcodeRealTimeData(studentId)
    ]);

    const latestProgress = dailyProgress[0];
    const stats: LeetCodeStats = latestProgress ? {
      totalSolved: latestProgress.totalSolved,
      easySolved: latestProgress.easySolved,
      mediumSolved: latestProgress.mediumSolved,
      hardSolved: latestProgress.hardSolved,
      acceptanceRate: latestProgress.acceptanceRate || 0,
      ranking: latestProgress.ranking || 0,
      totalSubmissions: latestProgress.totalSubmissions || 0,
      totalAccepted: latestProgress.totalAccepted || 0,
      languageStats: (latestProgress.languageStats as Record<string, number>) || {} as Record<string, number>
    } : {
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      acceptanceRate: 0,
      ranking: 0,
      totalSubmissions: 0,
      totalAccepted: 0,
      languageStats: {} as Record<string, number>
    };

    // Use real-time data if available, fallback to calculated values
    const currentStreak = realTimeData?.currentStreak ?? this.calculateStreakFromProgress(dailyProgress);
    const maxStreak = realTimeData?.maxStreak ?? await this.calculateMaxStreak(studentId);
    const totalActiveDays = realTimeData?.totalActiveDays ?? await this.calculateTotalActiveDays(studentId);
    const yearlyActivity = realTimeData?.yearlyActivity ? 
      (realTimeData.yearlyActivity as Array<{ date: string; count: number }>) : 
      (await this.getStudentDailyProgress(studentId, 365)).map(p => ({
        date: p.date,
        count: p.dailyIncrement
      }));

    // Calculate batch and university rankings
    const rankings = await this.calculateStudentRankings(studentId, stats.totalSolved);
    
    return {
      student,
      stats,
      currentStreak,
      maxStreak,
      totalActiveDays,
      weeklyRank: 1,
      batchRank: rankings.batchRank,
      universityRank: rankings.universityRank,
      batchSize: rankings.batchSize,
      universitySize: rankings.universitySize,
      badges,
      weeklyProgress: weeklyTrends.map(t => t.weeklyIncrement),
      dailyActivity: dailyProgress.map(p => ({
        date: p.date,
        count: p.dailyIncrement
      })),
      yearlyActivity
    };
  }

  async getAdminDashboard(): Promise<AdminDashboardData> {
    const [students, progressByStudent, realTimeByStudent, weeklyDataByStudent] = await Promise.all([
      this.getAllStudents(),
      this.getAllDailyProgressByStudent(),
      this.getAllRealTimeDataByStudent(),
      this.getAllWeeklyProgressDataByStudent(),
    ]);
    const totalStudents = students.length;

    const studentsWithStats = students.map((student) => {
      const progressArr = progressByStudent.get(student.id) || [];
      const latestProgress = progressArr[0];
      const weeklyProgress = weeklyDataByStudent.get(student.id);
      const realTimeData = realTimeByStudent.get(student.id);

      const stats = this.statsFromProgress(latestProgress);

      // Calculate real-time weekly progress
      const currentWeeklyProgress = weeklyProgress ?
        (latestProgress?.totalSolved || 0) - (weeklyProgress.week4Score || 0) : 0;

      // Determine status based on weekly progress thresholds
      let status = 'inactive';
      if (stats.totalSolved > 0) {
        if (currentWeeklyProgress >= 35) {
          status = 'Excellent';
        } else if (currentWeeklyProgress >= 25) {
          status = 'Good';
        } else if (currentWeeklyProgress >= 15) {
          status = 'Active';
        } else {
          status = 'Underperforming';
        }
      }

      // Get real-time data if available, fallback to in-memory calculations
      const maxStreak = realTimeData?.maxStreak ?? this.maxStreakFromArray(progressArr);
      const totalActiveDays = realTimeData?.totalActiveDays ?? this.activeDaysFromArray(progressArr);
      const currentStreak = realTimeData?.currentStreak ?? this.streakFromArray(progressArr);

      return {
        ...student,
        stats,
        weeklyProgress: Math.max(0, currentWeeklyProgress),
        streak: currentStreak,
        maxStreak,
        totalActiveDays,
        status
      };
    });

    const activeStudents = studentsWithStats.filter(s => s.status !== 'inactive').length;
    const avgProblems = totalStudents > 0 ? studentsWithStats.reduce((sum, s) => sum + s.stats.totalSolved, 0) / totalStudents : 0;
    const underperforming = studentsWithStats.filter(s => s.stats.totalSolved < avgProblems * 0.7).length;
    
    // Calculate streak statistics
    const maxStreakOverall = Math.max(...studentsWithStats.map(s => s.maxStreak), 0);
    const avgMaxStreak = totalStudents > 0 ? studentsWithStats.reduce((sum, s) => sum + s.maxStreak, 0) / totalStudents : 0;

    const leaderboard = studentsWithStats
      .sort((a, b) => b.stats.totalSolved - a.stats.totalSolved)
      .slice(0, 10)
      .map((student, index) => ({
        rank: index + 1,
        student: {
          id: student.id,
          name: student.name,
          leetcodeUsername: student.leetcodeUsername,
          leetcodeProfileLink: student.leetcodeProfileLink,
          profilePhoto: student.profilePhoto,
          githubUsername: student.githubUsername,
          batch: student.batch,
          createdAt: student.createdAt
        },
        weeklyScore: student.stats.totalSolved
      }));

    return {
      totalStudents,
      activeStudents,
      avgProblems,
      underperforming,
      maxStreakOverall,
      avgMaxStreak,
      students: studentsWithStats,
      leaderboard
    };
  }

  async getLeaderboard(): Promise<Array<{ rank: number; student: Student; weeklyScore: number }>> {
    const [students, progressByStudent] = await Promise.all([
      this.getAllStudents(),
      this.getAllDailyProgressByStudent(),
    ]);

    const studentsWithScores = students.map((student) => ({
      student,
      weeklyScore: progressByStudent.get(student.id)?.[0]?.totalSolved || 0,
    }));

    return studentsWithScores
      .sort((a, b) => b.weeklyScore - a.weeklyScore)
      .map((item, index) => ({
        rank: index + 1,
        ...item
      }));
  }



  // Helper methods
  async hasStudentEarnedBadge(studentId: string, badgeType: string): Promise<boolean> {
    const badge = await this.getBadgeByType(studentId, badgeType);
    return badge !== undefined;
  }

  async calculateStreak(studentId: string): Promise<number> {
    const progress = await this.getStudentDailyProgress(studentId, 30);
    let streak = 0;
    for (const p of progress) {
      if (p.dailyIncrement > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  async getWeeklyTrend(studentId: string, weekStart: string): Promise<WeeklyTrend | undefined> {
    const result = await db.select().from(weeklyTrends)
      .where(and(eq(weeklyTrends.studentId, studentId), eq(weeklyTrends.weekStart, weekStart)))
      .limit(1);
    return result[0];
  }

  async getLatestDailyProgress(studentId: string): Promise<DailyProgress | undefined> {
    const result = await db.select().from(dailyProgress)
      .where(eq(dailyProgress.studentId, studentId))
      .orderBy(desc(dailyProgress.date))
      .limit(1);
    return result[0];
  }

  // Weekly Progress Data methods
  async getWeeklyProgressData(studentId: string): Promise<WeeklyProgressData | undefined> {
    const result = await db.select().from(weeklyProgressData)
      .where(eq(weeklyProgressData.studentId, studentId))
      .limit(1);
    return result[0];
  }

  async getAllWeeklyProgressData(): Promise<WeeklyProgressData[]> {
    return await db.select().from(weeklyProgressData);
  }

  async createWeeklyProgressData(data: InsertWeeklyProgressData): Promise<WeeklyProgressData> {
    const result = await db.insert(weeklyProgressData).values(data).returning();
    return result[0];
  }

  async updateWeeklyProgressData(studentId: string, updates: Partial<WeeklyProgressData>): Promise<WeeklyProgressData | undefined> {
    const result = await db.update(weeklyProgressData)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(weeklyProgressData.studentId, studentId))
      .returning();
    return result[0];
  }

  async deleteWeeklyProgressData(studentId: string): Promise<boolean> {
    const result = await db.delete(weeklyProgressData)
      .where(eq(weeklyProgressData.studentId, studentId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // LeetCode Real-time Data methods
  async getLeetcodeRealTimeData(studentId: string): Promise<LeetcodeRealTimeData | undefined> {
    const result = await db.select().from(leetcodeRealTimeData)
      .where(eq(leetcodeRealTimeData.studentId, studentId))
      .limit(1);
    return result[0];
  }

  async createLeetcodeRealTimeData(data: InsertLeetcodeRealTimeData): Promise<LeetcodeRealTimeData> {
    const result = await db.insert(leetcodeRealTimeData).values(data).returning();
    return result[0];
  }

  async updateLeetcodeRealTimeData(studentId: string, updates: Partial<LeetcodeRealTimeData>): Promise<LeetcodeRealTimeData | undefined> {
    const result = await db.update(leetcodeRealTimeData)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leetcodeRealTimeData.studentId, studentId))
      .returning();
    return result[0];
  }

  async deleteLeetcodeRealTimeData(studentId: string): Promise<boolean> {
    const result = await db.delete(leetcodeRealTimeData)
      .where(eq(leetcodeRealTimeData.studentId, studentId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  private calculateStreakFromProgress(progress: DailyProgress[]): number {
    let streak = 0;
    for (const p of progress) {
      if (p.dailyIncrement > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  private async calculateStudentRankings(studentId: string, totalSolved: number): Promise<{
    batchRank: number;
    universityRank: number;
    batchSize: number;
    universitySize: number;
  }> {
    const student = await this.getStudent(studentId);
    if (!student) {
      return { batchRank: 0, universityRank: 0, batchSize: 0, universitySize: 0 };
    }

    // Get all students for university ranking (single query) and the
    // latest progress for everyone in one grouped query.
    const [allStudents, progressByStudent] = await Promise.all([
      this.getAllStudents(),
      this.getAllDailyProgressByStudent(),
    ]);

    // All students in the same batch (filtered in memory).
    const batchStudents = allStudents.filter(s => s.batch === student.batch);

    const batchStudentsWithProgress = batchStudents.map((s) => ({
      student: s,
      totalSolved: progressByStudent.get(s.id)?.[0]?.totalSolved || 0,
    }));

    const allStudentsWithProgress = allStudents.map((s) => ({
      student: s,
      totalSolved: progressByStudent.get(s.id)?.[0]?.totalSolved || 0,
    }));

    // Sort by total problems solved (descending)
    batchStudentsWithProgress.sort((a, b) => b.totalSolved - a.totalSolved);
    allStudentsWithProgress.sort((a, b) => b.totalSolved - a.totalSolved);

    // Find rankings
    const batchRank = batchStudentsWithProgress.findIndex(s => s.student.id === studentId) + 1;
    const universityRank = allStudentsWithProgress.findIndex(s => s.student.id === studentId) + 1;

    return {
      batchRank: batchRank || batchStudentsWithProgress.length,
      universityRank: universityRank || allStudentsWithProgress.length,
      batchSize: batchStudentsWithProgress.length,
      universitySize: allStudentsWithProgress.length
    };
  }

  async calculateMaxStreak(studentId: string): Promise<number> {
    // Get all daily progress for the student, sorted by date
    const allProgress = await db.select()
      .from(dailyProgress)
      .where(eq(dailyProgress.studentId, studentId))
      .orderBy(desc(dailyProgress.date));

    if (allProgress.length === 0) return 0;

    let maxStreak = 0;
    let currentStreak = 0;

    // Reverse to go from oldest to newest
    const reversedProgress = allProgress.reverse();
    
    for (const progress of reversedProgress) {
      if (progress.dailyIncrement > 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return maxStreak;
  }

  async calculateTotalActiveDays(studentId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(dailyProgress)
      .where(and(
        eq(dailyProgress.studentId, studentId),
        sql`${dailyProgress.dailyIncrement} > 0`
      ));
    
    return result[0]?.count || 0;
  }

  // Batch-specific methods
  async getStudentsByBatch(batch: string): Promise<Student[]> {
    return await db.select().from(students).where(eq(students.batch, batch));
  }

  async getAllStudentsWithBatch(): Promise<Student[]> {
    return await db.select().from(students);
  }

  async getBatchDashboard(batch: string): Promise<BatchDashboardData> {
    const [batchStudents, progressByStudent, realTimeByStudent] = await Promise.all([
      this.getStudentsByBatch(batch),
      this.getAllDailyProgressByStudent(),
      this.getAllRealTimeDataByStudent(),
    ]);
    return this.computeBatchDashboard(batch, batchStudents, progressByStudent, realTimeByStudent);
  }

  // Pure computation shared by getBatchDashboard and getUniversityDashboard
  // so the university view can fetch the (large) progress/real-time maps once
  // instead of re-querying them for each batch.
  private computeBatchDashboard(
    batch: string,
    batchStudents: Student[],
    progressByStudent: Map<string, DailyProgress[]>,
    realTimeByStudent: Map<string, LeetcodeRealTimeData>,
  ): BatchDashboardData {
    const totalStudents = batchStudents.length;

    if (totalStudents === 0) {
      return {
        batch,
        totalStudents: 0,
        activeStudents: 0,
        avgProblems: 0,
        underperforming: 0,
        maxStreakOverall: 0,
        avgMaxStreak: 0,
        students: [],
        leaderboard: []
      };
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

    const studentsWithStats = batchStudents.map((student) => {
      const progressArr = progressByStudent.get(student.id) || []; // newest first
      const latestProgress = progressArr[0];

      const stats = this.statsFromProgress(latestProgress);

      // Calculate weekly progress: oldest entry within the last 7 days.
      const weekEntries = progressArr.filter(p => p.date >= oneWeekAgoStr);
      const oldestInWeek = weekEntries[weekEntries.length - 1];
      const currentWeeklyProgress = weekEntries.length > 0
        ? (latestProgress?.totalSolved || 0) - (oldestInWeek?.totalSolved || 0)
        : 0;

      const status = this.calculateStatus(stats.totalSolved, currentWeeklyProgress);

      // Get real-time data if available, fallback to in-memory calculations
      const realTimeData = realTimeByStudent.get(student.id);
      const maxStreak = realTimeData?.maxStreak ?? this.maxStreakFromArray(progressArr);
      const totalActiveDays = realTimeData?.totalActiveDays ?? this.activeDaysFromArray(progressArr);
      const currentStreak = realTimeData?.currentStreak ?? this.streakFromArray(progressArr);

      return {
        ...student,
        stats,
        weeklyProgress: Math.max(0, currentWeeklyProgress),
        streak: currentStreak,
        maxStreak,
        totalActiveDays,
        status
      };
    });

    const activeStudents = studentsWithStats.filter(s => s.status !== 'inactive').length;
    const avgProblems = totalStudents > 0 ? studentsWithStats.reduce((sum, s) => sum + s.stats.totalSolved, 0) / totalStudents : 0;
    const underperforming = studentsWithStats.filter(s => s.stats.totalSolved < avgProblems * 0.7).length;

    // Calculate streak statistics
    const maxStreakOverall = Math.max(...studentsWithStats.map(s => s.maxStreak), 0);
    const avgMaxStreak = totalStudents > 0 ? studentsWithStats.reduce((sum, s) => sum + s.maxStreak, 0) / totalStudents : 0;

    const leaderboard = studentsWithStats
      .sort((a, b) => b.stats.totalSolved - a.stats.totalSolved)
      .slice(0, 10)
      .map((student, index) => ({
        rank: index + 1,
        student: {
          id: student.id,
          name: student.name,
          leetcodeUsername: student.leetcodeUsername,
          leetcodeProfileLink: student.leetcodeProfileLink,
          profilePhoto: student.profilePhoto,
          githubUsername: student.githubUsername,
          batch: student.batch,
          createdAt: student.createdAt
        },
        weeklyScore: student.stats.totalSolved
      }));

    return {
      batch,
      totalStudents,
      activeStudents,
      avgProblems,
      underperforming,
      maxStreakOverall,
      avgMaxStreak,
      students: studentsWithStats,
      leaderboard
    };
  }

  async getBatchLeaderboard(batch: string): Promise<Array<{ rank: number; student: Student; weeklyScore: number }>> {
    const [batchStudents, progressByStudent] = await Promise.all([
      this.getStudentsByBatch(batch),
      this.getAllDailyProgressByStudent(),
    ]);

    const studentsWithScores = batchStudents.map((student) => ({
      student,
      weeklyScore: progressByStudent.get(student.id)?.[0]?.totalSolved || 0,
    }));

    return studentsWithScores
      .sort((a, b) => b.weeklyScore - a.weeklyScore)
      .map((item, index) => ({
        rank: index + 1,
        ...item
      }));
  }

  async getUniversityLeaderboard(): Promise<Array<{ rank: number; student: Student; totalSolved: number; batch: string }>> {
    const [allStudents, progressByStudent] = await Promise.all([
      this.getAllStudentsWithBatch(),
      this.getAllDailyProgressByStudent(),
    ]);

    const studentsWithScores = allStudents.map((student) => ({
      student,
      totalSolved: progressByStudent.get(student.id)?.[0]?.totalSolved || 0,
      batch: student.batch,
    }));

    return studentsWithScores
      .sort((a, b) => b.totalSolved - a.totalSolved)
      .map((item, index) => ({
        rank: index + 1,
        ...item
      }));
  }

  async getUniversityDashboard(): Promise<UniversityDashboardData> {
    // Fetch the shared, expensive maps ONCE and reuse them for both batches
    // and the university leaderboard (previously this re-queried the full
    // daily-progress table three times).
    const [allStudents, progressByStudent, realTimeByStudent] = await Promise.all([
      this.getAllStudents(),
      this.getAllDailyProgressByStudent(),
      this.getAllRealTimeDataByStudent(),
    ]);

    const students2027 = allStudents.filter(s => s.batch === "2027");
    const students2028 = allStudents.filter(s => s.batch === "2028");

    const batch2027Data = this.computeBatchDashboard("2027", students2027, progressByStudent, realTimeByStudent);
    const batch2028Data = this.computeBatchDashboard("2028", students2028, progressByStudent, realTimeByStudent);

    const universityLeaderboard = allStudents
      .map((student) => ({
        student,
        totalSolved: progressByStudent.get(student.id)?.[0]?.totalSolved || 0,
        batch: student.batch,
      }))
      .sort((a, b) => b.totalSolved - a.totalSolved)
      .map((item, index) => ({ rank: index + 1, ...item }));

    const combined = {
      totalStudents: batch2027Data.totalStudents + batch2028Data.totalStudents,
      activeStudents: batch2027Data.activeStudents + batch2028Data.activeStudents,
      avgProblems: (batch2027Data.avgProblems * batch2027Data.totalStudents + batch2028Data.avgProblems * batch2028Data.totalStudents) / 
                   (batch2027Data.totalStudents + batch2028Data.totalStudents) || 0,
      underperforming: batch2027Data.underperforming + batch2028Data.underperforming,
      maxStreakOverall: Math.max(batch2027Data.maxStreakOverall, batch2028Data.maxStreakOverall),
      avgMaxStreak: (batch2027Data.avgMaxStreak * batch2027Data.totalStudents + batch2028Data.avgMaxStreak * batch2028Data.totalStudents) / 
                    (batch2027Data.totalStudents + batch2028Data.totalStudents) || 0,
      universityLeaderboard: universityLeaderboard.slice(0, 20) // Top 20 university-wide
    };

    return {
      batch2027: batch2027Data,
      batch2028: batch2028Data,
      combined
    };
  }

  private calculateStatus(totalSolved: number, weeklyProgress: number): string {
    if (totalSolved >= 100 && weeklyProgress >= 15) return 'Excellent';
    if (totalSolved >= 50 && weeklyProgress >= 10) return 'Good';
    if (weeklyProgress >= 5) return 'Active';
    return 'Underperforming';
  }
}

export const storage = new PostgreSQLStorage();
