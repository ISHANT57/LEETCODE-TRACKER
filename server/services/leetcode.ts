import { storage } from "../storage";
import type { LeetCodeStats } from "@shared/schema";

// Enhanced interface to include streak and activity data
interface EnhancedLeetCodeStats extends LeetCodeStats {
  submissionCalendar: string;
  currentStreak: number;
  maxStreak: number;
  totalActiveDays: number;
  yearlyActivity: Array<{ date: string; count: number }>;
  profilePhoto?: string; // LeetCode profile avatar URL
}

interface LeetCodeResponse {
  data: {
    matchedUser: {
      username: string;
      profile: {
        ranking: number;
        userAvatar: string;
        realName: string;
        aboutMe: string;
        school: string;
        websites: string[];
        countryName: string;
        company: string;
        jobTitle: string;
        skillTags: string[];
        postViewCount: number;
        postViewCountDiff: number;
        reputation: number;
        reputationDiff: number;
        solutionCount: number;
        solutionCountDiff: number;
        categoryDiscussCount: number;
        categoryDiscussCountDiff: number;
      };
      submitStats: {
        acSubmissionNum: Array<{
          difficulty: string;
          count: number;
          submissions: number;
        }>;
        totalSubmissionNum: Array<{
          difficulty: string;
          count: number;
          submissions: number;
        }>;
      };
      languageProblemCount: Array<{
        languageName: string;
        problemsSolved: number;
      }>;
      submissionCalendar: string;
      problemsSolvedBeatsStats: Array<{
        difficulty: string;
        percentage: number;
      }>;
    } | null;
  };
}

export class LeetCodeService {
  private readonly GRAPHQL_ENDPOINT = "https://leetcode.com/graphql";
  
  /**
   * Parse LeetCode's submission calendar JSON to calculate streaks and activity data
   */
  private parseSubmissionCalendar(calendarJson: string): {
    currentStreak: number;
    maxStreak: number;
    totalActiveDays: number;
    yearlyActivity: Array<{ date: string; count: number }>;
  } {
    try {
      const calendar = JSON.parse(calendarJson);
      
      // Convert timestamps to activity data
      const activityData: Array<{ date: string; count: number; timestamp: number }> = [];
      
      // Process all timestamps from the calendar
      for (const [timestampStr, count] of Object.entries(calendar)) {
        const timestamp = parseInt(timestampStr);
        const date = new Date(timestamp * 1000); // Convert to milliseconds
        const dateStr = date.toISOString().split('T')[0];
        
        activityData.push({
          date: dateStr,
          count: count as number,
          timestamp
        });
      }
      
      // Sort by timestamp (oldest first for proper processing)
      activityData.sort((a, b) => a.timestamp - b.timestamp);
      
      // Get today's date for streak calculations
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      // Calculate current streak (consecutive days from today backwards)
      const sortedByDateDesc = [...activityData].sort((a, b) => b.timestamp - a.timestamp);
      let currentStreak = 0;
      
      // Get today as a date string
      const todayStr = today.toISOString().split('T')[0];
      let checkDateStr = todayStr;
      let checkDate = new Date(todayStr);
      
      // Create a map for quick lookup by date string
      const activityMap = new Map<string, number>();
      activityData.forEach(activity => {
        activityMap.set(activity.date, activity.count);
      });
      
      // Count consecutive days from today backwards
      while (true) {
        const count = activityMap.get(checkDateStr) || 0;
        if (count > 0) {
          currentStreak++;
          // Move to previous day
          checkDate.setDate(checkDate.getDate() - 1);
          checkDateStr = checkDate.toISOString().split('T')[0];
        } else {
          break; // Streak is broken
        }
      }
      
      // Calculate max streak by checking consecutive days
      let maxStreak = 0;
      let tempStreak = 0;
      
      // Sort activity data by date for sequential processing
      const sortedByDate = [...activityData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      let previousDate: Date | null = null;
      
      for (const activity of sortedByDate) {
        if (activity.count > 0) {
          const currentDate = new Date(activity.date);
          
          if (previousDate === null) {
            // First active day
            tempStreak = 1;
          } else {
            // Check if this is consecutive day
            const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 1) {
              // Consecutive day
              tempStreak++;
            } else {
              // Gap in days, restart streak
              tempStreak = 1;
            }
          }
          
          maxStreak = Math.max(maxStreak, tempStreak);
          previousDate = currentDate;
        }
      }
      
      // Calculate total active days
      const totalActiveDays = activityData.filter(activity => activity.count > 0).length;
      
      // Create yearly activity array (past year)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      const yearlyActivity: Array<{ date: string; count: number }> = [];
      
      // Generate all dates for the past year
      const currentDate = new Date(oneYearAgo);
      while (currentDate <= today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        yearlyActivity.push({
          date: dateStr,
          count: activityMap.get(dateStr) || 0
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return {
        currentStreak,
        maxStreak,
        totalActiveDays,
        yearlyActivity
      };
    } catch (error) {
      console.error('Error parsing submission calendar:', error);
      return {
        currentStreak: 0,
        maxStreak: 0,
        totalActiveDays: 0,
        yearlyActivity: []
      };
    }
  }
  
  private readonly USER_PROFILE_QUERY = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          ranking
          userAvatar
          realName
          aboutMe
          school
          websites
          countryName
          company
          jobTitle
          skillTags
          postViewCount
          postViewCountDiff
          reputation
          reputationDiff
          solutionCount
          solutionCountDiff
          categoryDiscussCount
          categoryDiscussCountDiff
        }
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
          totalSubmissionNum {
            difficulty
            count
            submissions
          }
        }
        languageProblemCount {
          languageName
          problemsSolved
        }
        submissionCalendar
        problemsSolvedBeatsStats {
          difficulty
          percentage
        }
      }
    }
  `;

  async fetchUserStats(username: string): Promise<EnhancedLeetCodeStats | null> {
    try {
      const response = await fetch(this.GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: JSON.stringify({
          query: this.USER_PROFILE_QUERY,
          variables: { username }
        })
      });

      if (!response.ok) {
        console.error(`LeetCode API error for ${username}: ${response.status}`);
        return null;
      }

      const data: LeetCodeResponse = await response.json();
      
      if (!data.data?.matchedUser) {
        console.error(`User not found: ${username}`);
        return null;
      }

      const acSubmissions = data.data.matchedUser.submitStats.acSubmissionNum;
      const totalSubmissions = data.data.matchedUser.submitStats.totalSubmissionNum;
      const languageStats = data.data.matchedUser.languageProblemCount || [];
      
      const totalSolved = acSubmissions.find(stat => stat.difficulty === "All")?.count || 0;
      const easySolved = acSubmissions.find(stat => stat.difficulty === "Easy")?.count || 0;
      const mediumSolved = acSubmissions.find(stat => stat.difficulty === "Medium")?.count || 0;
      const hardSolved = acSubmissions.find(stat => stat.difficulty === "Hard")?.count || 0;

      // Calculate acceptance rate from total submissions vs accepted submissions
      const totalSubmissionCount = totalSubmissions.find(stat => stat.difficulty === "All")?.submissions || 0;
      const totalAcceptedCount = acSubmissions.find(stat => stat.difficulty === "All")?.submissions || 0;
      const acceptanceRate = totalSubmissionCount > 0 ? (totalAcceptedCount / totalSubmissionCount) * 100 : 0;
      
      // Extract ranking and profile photo from profile data
      const ranking = data.data.matchedUser.profile?.ranking || 0;
      const profilePhoto = data.data.matchedUser.profile?.userAvatar || undefined;

      // Process language statistics
      const languageStatsObj = languageStats.reduce((acc: any, lang) => {
        acc[lang.languageName] = lang.problemsSolved;
        return acc;
      }, {});

      // Parse submission calendar for streak and activity data
      const submissionCalendar = data.data.matchedUser.submissionCalendar || '{}';
      const { currentStreak, maxStreak, totalActiveDays, yearlyActivity } = this.parseSubmissionCalendar(submissionCalendar);

      return {
        totalSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        acceptanceRate: Math.round(acceptanceRate * 100) / 100,
        ranking,
        totalSubmissions: totalSubmissionCount,
        totalAccepted: totalAcceptedCount,
        languageStats: languageStatsObj,
        submissionCalendar,
        currentStreak,
        maxStreak,
        totalActiveDays,
        yearlyActivity,
        profilePhoto,
      };
    } catch (error) {
      console.error(`Error fetching LeetCode data for ${username}:`, error);
      return null;
    }
  }

  async syncStudentData(studentId: string): Promise<boolean> {
    try {
      const student = await storage.getStudent(studentId);
      if (!student) return false;

      const stats = await this.fetchUserStats(student.leetcodeUsername);
      if (!stats) return false;

      const today = new Date().toISOString().split('T')[0];
      const existingProgress = await storage.getDailyProgress(studentId, today);
      
      let dailyIncrement = 0;
      if (existingProgress) {
        dailyIncrement = stats.totalSolved - existingProgress.totalSolved;
        await storage.updateDailyProgress(studentId, today, {
          totalSolved: stats.totalSolved,
          easySolved: stats.easySolved,
          mediumSolved: stats.mediumSolved,
          hardSolved: stats.hardSolved,
          dailyIncrement,
          ranking: stats.ranking,
          acceptanceRate: Math.round(stats.acceptanceRate * 100), // Store as integer percentage * 100
          totalSubmissions: stats.totalSubmissions,
          totalAccepted: stats.totalAccepted,
          languageStats: stats.languageStats,
        });
      } else {
        // For new entries, calculate increment from yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const yesterdayProgress = await storage.getDailyProgress(studentId, yesterdayStr);
        
        dailyIncrement = yesterdayProgress ? 
          stats.totalSolved - yesterdayProgress.totalSolved : 
          stats.totalSolved;

        await storage.createDailyProgress({
          studentId,
          date: today,
          totalSolved: stats.totalSolved,
          easySolved: stats.easySolved,
          mediumSolved: stats.mediumSolved,
          hardSolved: stats.hardSolved,
          dailyIncrement,
          ranking: stats.ranking,
          acceptanceRate: Math.round(stats.acceptanceRate * 100), // Store as integer percentage * 100
          totalSubmissions: stats.totalSubmissions,
          totalAccepted: stats.totalAccepted,
          languageStats: stats.languageStats,
        });
      }

      // Update weekly trend
      await this.updateWeeklyTrend(studentId, stats.totalSolved);

      // Update anchored Week 1–4 progress (weeks run in 7-day blocks from
      // WEEK_ANCHOR; the current week's score refreshes on every daily sync).
      await this.updateWeeklyProgressAnchored(studentId, stats.totalSolved);

      // Check for badge achievements
      await this.checkBadgeAchievements(studentId, stats, dailyIncrement);

      // Update student profile photo if available
      if (stats.profilePhoto && stats.profilePhoto !== student.profilePhoto) {
        await storage.updateStudent(studentId, { profilePhoto: stats.profilePhoto });
      }

      // Store or update real-time data
      const existingRealTimeData = await storage.getLeetcodeRealTimeData(studentId);
      const realTimeDataToStore = {
        studentId,
        submissionCalendar: stats.submissionCalendar,
        currentStreak: stats.currentStreak,
        maxStreak: stats.maxStreak,
        totalActiveDays: stats.totalActiveDays,
        yearlyActivity: stats.yearlyActivity,
      };

      if (existingRealTimeData) {
        await storage.updateLeetcodeRealTimeData(studentId, realTimeDataToStore);
      } else {
        await storage.createLeetcodeRealTimeData(realTimeDataToStore);
      }

      return true;
    } catch (error) {
      console.error(`Error syncing student data for ${studentId}:`, error);
      return false;
    }
  }

  async syncAllStudents(): Promise<{ success: number; failed: number }> {
    const students = await storage.getAllStudents();
    const results = await Promise.allSettled(
      students.map(student => this.syncStudentData(student.id))
    );

    const success = results.filter(result => result.status === 'fulfilled' && result.value).length;
    const failed = results.length - success;

    // Update last sync time
    await storage.updateAppSettings({
      lastSyncTime: new Date(),
    });

    return { success, failed };
  }

  async syncAllProfilePhotos(): Promise<{ success: number; failed: number }> {
    const students = await storage.getAllStudents();
    const results = await Promise.allSettled(
      students.map(async (student) => {
        try {
          const stats = await this.fetchUserStats(student.leetcodeUsername);
          if (stats?.profilePhoto && stats.profilePhoto !== student.profilePhoto) {
            await storage.updateStudent(student.id, { profilePhoto: stats.profilePhoto });
            return true;
          }
          return true; // No update needed, but not a failure
        } catch (error) {
          console.error(`Error updating profile photo for ${student.leetcodeUsername}:`, error);
          return false;
        }
      })
    );

    const success = results.filter(result => result.status === 'fulfilled' && result.value).length;
    const failed = results.length - success;

    return { success, failed };
  }

  // Weekly tracking anchor: Week 1 begins on this date and each subsequent
  // week is a fixed 7-day block (Week 1 = Jul 1–7, Week 2 = Jul 8–14, …).
  private static readonly WEEK_ANCHOR = Date.UTC(2026, 6, 1); // 2026-07-01 (month is 0-based)

  /** Current 1-based week number relative to WEEK_ANCHOR (>=1). */
  private currentWeekIndex(): number {
    const now = new Date();
    const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const diffDays = Math.floor((todayUTC - LeetCodeService.WEEK_ANCHOR) / (24 * 60 * 60 * 1000));
    if (diffDays < 0) return 1; // before the anchor → treat as Week 1 baseline
    return Math.floor(diffDays / 7) + 1;
  }

  /**
   * Populate the Week 1–4 progress snapshot from live sync data, anchored to
   * WEEK_ANCHOR. The current week's score is set to the latest cumulative
   * total on every sync (so it updates daily); already-elapsed weeks stay
   * frozen at their end-of-week value, and not-yet-reached weeks track the
   * current total so their progress delta reads 0 instead of going negative.
   */
  private async updateWeeklyProgressAnchored(studentId: string, totalSolved: number): Promise<void> {
    const week = Math.min(4, Math.max(1, this.currentWeekIndex()));
    const existing = await storage.getWeeklyProgressData(studentId);

    const scores = [
      existing?.week1Score ?? 0,
      existing?.week2Score ?? 0,
      existing?.week3Score ?? 0,
      existing?.week4Score ?? 0,
    ];

    // Set the current week and every future week to the current cumulative
    // total; leave already-completed weeks (index < week-1) untouched/frozen.
    for (let i = week - 1; i < 4; i++) scores[i] = totalSolved;

    const [week1Score, week2Score, week3Score, week4Score] = scores;
    const week2Progress = week2Score - week1Score;
    const week3Progress = week3Score - week2Score;
    const week4Progress = week4Score - week3Score;
    const totalScore = week1Score + week2Score + week3Score + week4Score;
    const deltas = [week2Progress, week3Progress, week4Progress];
    const averageWeeklyGrowth = Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length);

    const payload = {
      studentId,
      week1Score,
      week2Score,
      week3Score,
      week4Score,
      week2Progress,
      week3Progress,
      week4Progress,
      totalScore,
      averageWeeklyGrowth,
    };

    if (existing) {
      await storage.updateWeeklyProgressData(studentId, payload);
    } else {
      await storage.createWeeklyProgressData(payload);
    }
  }

  private async updateWeeklyTrend(studentId: string, totalSolved: number): Promise<void> {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    
    const existingTrend = await storage.getCurrentWeekTrend(studentId);
    
    if (existingTrend) {
      const weeklyIncrement = totalSolved - (existingTrend.totalProblems - existingTrend.weeklyIncrement);
      // Update would need to be implemented in storage
    } else {
      // Get last week's total to calculate increment
      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekTrends = await storage.getWeeklyTrends(studentId, 1);
      const lastWeekTotal = lastWeekTrends.length > 0 ? lastWeekTrends[0].totalProblems : 0;
      
      const weeklyIncrement = totalSolved - lastWeekTotal;
      
      await storage.createWeeklyTrend({
        studentId,
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        totalProblems: totalSolved,
        weeklyIncrement,
        ranking: 0, // Will be calculated later
      });
    }
  }

  private async checkBadgeAchievements(
    studentId: string, 
    stats: LeetCodeStats, 
    dailyIncrement: number
  ): Promise<void> {
    // Check for Century Coder badge (100+ total problems)
    if (stats.totalSolved >= 100) {
      const hasCenturyBadge = await storage.hasStudentEarnedBadge(studentId, 'century_coder');
      if (!hasCenturyBadge) {
        await storage.createBadge({
          studentId,
          badgeType: 'century_coder',
          title: '💯 Century Coder',
          description: '100+ total problems solved',
          icon: 'fas fa-code',
        });
      }
    }

    // Check for Streak Master badge (7-day streak of 5+ daily problems)
    const streak = await storage.calculateStreak(studentId);
    if (streak >= 7) {
      const hasStreakBadge = await storage.hasStudentEarnedBadge(studentId, 'streak_master');
      if (!hasStreakBadge) {
        await storage.createBadge({
          studentId,
          badgeType: 'streak_master',
          title: '🧐 Streak Master',
          description: '7-day streak of 5+ daily problems',
          icon: 'fas fa-fire',
        });
      }
    }

    // Check for Comeback Coder badge (big week-over-week improvement)
    const weeklyTrends = await storage.getWeeklyTrends(studentId, 2);
    if (weeklyTrends.length >= 2) {
      const thisWeek = weeklyTrends[0];
      const lastWeek = weeklyTrends[1];
      const weeklyImprovement = thisWeek.weeklyIncrement - lastWeek.weeklyIncrement;
      
      if (weeklyImprovement >= 15) { // Big improvement threshold
        const hasComebackBadge = await storage.hasStudentEarnedBadge(studentId, 'comeback_coder');
        if (!hasComebackBadge) {
          await storage.createBadge({
            studentId,
            badgeType: 'comeback_coder',
            title: '🔥 Comeback Coder',
            description: 'Big week-over-week improvement',
            icon: 'fas fa-chart-line',
          });
        }
      }
    }

    // Check for Consistency Champ badge (30-day challenge completion)
    const dailyProgress = await storage.getStudentDailyProgress(studentId, 30);
    const activeDays = dailyProgress.filter(p => p.dailyIncrement > 0).length;
    
    if (activeDays >= 30) {
      const hasConsistencyBadge = await storage.hasStudentEarnedBadge(studentId, 'consistency_champ');
      if (!hasConsistencyBadge) {
        await storage.createBadge({
          studentId,
          badgeType: 'consistency_champ',
          title: '🧱 Consistency Champ',
          description: 'Completed 30-day challenge',
          icon: 'fas fa-calendar-check',
        });
      }
    }

    // Check for Weekly Topper badge (top performer this week)
    await this.checkWeeklyTopperBadge(studentId);
  }

  private async checkWeeklyTopperBadge(studentId: string): Promise<void> {
    // Get current week rankings
    const currentWeekTrend = await storage.getCurrentWeekTrend(studentId);
    if (currentWeekTrend && currentWeekTrend.ranking === 1) {
      const hasWeeklyTopperBadge = await storage.hasStudentEarnedBadge(studentId, 'weekly_topper');
      if (!hasWeeklyTopperBadge) {
        await storage.createBadge({
          studentId,
          badgeType: 'weekly_topper',
          title: '🏆 Weekly Topper',
          description: 'Top performer this week',
          icon: 'fas fa-trophy',
        });
      }
    }
  }
}

export const leetCodeService = new LeetCodeService();
