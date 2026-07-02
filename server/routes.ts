import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { leetCodeService } from "./services/leetcode";
import { schedulerService } from "./services/scheduler";
import { csvImportService } from "./services/csv-import";
import { weeklyProgressImportService } from "./services/weekly-progress-import";
import path from 'path';
import { insertStudentSchema } from "@shared/schema";
import studentsData from "../attached_assets/students_1753783623487.json";
import batch2027Data from "../attached_assets/batch_2027_real_students.json";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize students from JSON file
  app.post("/api/init-students", async (req, res) => {
    try {
      let importedCount = 0;
      
      for (const studentData of studentsData) {
        const existing = await storage.getStudentByUsername(studentData.leetcodeUsername);
        if (!existing) {
          await storage.createStudent({
            name: studentData.name,
            leetcodeUsername: studentData.leetcodeUsername,
            leetcodeProfileLink: studentData.leetcodeProfileLink,
            batch: "2028", // Explicitly set batch for existing data
          });
          importedCount++;
        }
      }
      
      res.json({ 
        message: `Imported ${importedCount} new students`,
        total: studentsData.length 
      });
    } catch (error) {
      console.error('Error importing students:', error);
      res.status(500).json({ error: "Failed to import students" });
    }
  });

  // Import Batch 2027 students
  app.post("/api/init-batch-2027", async (req, res) => {
    try {
      let importedCount = 0;
      
      for (const studentData of batch2027Data) {
        const existing = await storage.getStudentByUsername(studentData.leetcodeUsername);
        if (!existing) {
          await storage.createStudent({
            name: studentData.name,
            leetcodeUsername: studentData.leetcodeUsername,
            leetcodeProfileLink: studentData.leetcodeProfileLink,
            batch: "2027",
          });
          importedCount++;
        }
      }
      
      res.json({ 
        message: `Imported ${importedCount} new Batch 2027 students`,
        total: batch2027Data.length 
      });
    } catch (error) {
      console.error('Error importing Batch 2027 students:', error);
      res.status(500).json({ error: "Failed to import Batch 2027 students" });
    }
  });

  // Replace existing Batch 2027 students with real data
  app.post("/api/replace-batch-2027", async (req, res) => {
    try {
      // First, delete all existing Batch 2027 students
      const existingStudents = await storage.getStudentsByBatch('2027');
      console.log(`Found ${existingStudents.length} existing Batch 2027 students to replace`);
      
      for (const student of existingStudents) {
        await storage.deleteStudentByUsername(student.leetcodeUsername);
      }
      
      // Import the real Batch 2027 students
      let importedCount = 0;
      for (const studentData of batch2027Data) {
        await storage.createStudent({
          name: studentData.name,
          leetcodeUsername: studentData.leetcodeUsername,
          leetcodeProfileLink: studentData.leetcodeProfileLink,
          batch: "2027",
        });
        importedCount++;
      }
      
      res.json({ 
        message: `Replaced Batch 2027 with ${importedCount} real students`,
        deleted: existingStudents.length,
        imported: importedCount 
      });
    } catch (error) {
      console.error('Error replacing Batch 2027 students:', error);
      res.status(500).json({ error: "Failed to replace Batch 2027 students" });
    }
  });

  // Get all students
  app.get("/api/students", async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  // Delete student by username
  app.delete("/api/students/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const success = await storage.deleteStudentByUsername(username);
      if (success) {
        res.json({ message: `Student ${username} deleted successfully` });
      } else {
        res.status(404).json({ error: "Student not found or failed to delete" });
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({ error: "Failed to delete student" });
    }
  });

  // Bulk delete students
  app.post("/api/students/bulk-delete", async (req, res) => {
    try {
      const { usernames } = req.body;
      if (!Array.isArray(usernames)) {
        return res.status(400).json({ error: "Usernames must be an array" });
      }

      const results = await Promise.allSettled(
        usernames.map(username => storage.deleteStudentByUsername(username))
      );

      const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
      const failed = results.length - successful;

      res.json({ 
        message: `Bulk delete completed: ${successful} successful, ${failed} failed`,
        successful,
        failed,
        total: results.length
      });
    } catch (error) {
      console.error('Error bulk deleting students:', error);
      res.status(500).json({ error: "Failed to bulk delete students" });
    }
  });

  // Update a single student's editable fields (currently just the GitHub handle).
  // Used by the admin "GitHub Handles" manager to drive avatar photos.
  app.patch("/api/students/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { githubUsername } = req.body ?? {};

      // Normalize: trim, strip a leading "@" or a full github.com URL, and
      // treat an empty string as clearing the handle (null).
      let handle: string | null = null;
      if (typeof githubUsername === "string" && githubUsername.trim() !== "") {
        handle = githubUsername
          .trim()
          .replace(/^@/, "")
          .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
          .replace(/\/+$/, "");
      }

      const updated = await storage.updateStudent(id, { githubUsername: handle });
      if (!updated) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ error: "Failed to update student" });
    }
  });

  // Get student dashboard data
  app.get("/api/dashboard/student/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const student = await storage.getStudentByUsername(username);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      const dashboardData = await storage.getStudentDashboard(student.id);
      
      if (!dashboardData) {
        return res.status(404).json({ error: "Student not found" });
      }
      
      res.json(dashboardData);
    } catch (error) {
      console.error('Error fetching student dashboard:', error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // Get admin dashboard data
  app.get("/api/dashboard/admin", async (req, res) => {
    try {
      const dashboardData = await storage.getAdminDashboard();
      res.json(dashboardData);
    } catch (error) {
      console.error('Error fetching admin dashboard:', error);
      res.status(500).json({ error: "Failed to fetch admin dashboard data" });
    }
  });

  // Get batch dashboard data
  app.get("/api/dashboard/batch/:batch", async (req, res) => {
    try {
      const { batch } = req.params;
      if (!["2027", "2028"].includes(batch)) {
        return res.status(400).json({ error: "Invalid batch. Must be 2027 or 2028" });
      }
      const dashboardData = await storage.getBatchDashboard(batch);
      res.json(dashboardData);
    } catch (error) {
      console.error('Error fetching batch dashboard:', error);
      res.status(500).json({ error: "Failed to fetch batch dashboard data" });
    }
  });

  // Get university dashboard data (combined batches)
  app.get("/api/dashboard/university", async (req, res) => {
    try {
      const dashboardData = await storage.getUniversityDashboard();
      res.json(dashboardData);
    } catch (error) {
      console.error('Error fetching university dashboard:', error);
      res.status(500).json({ error: "Failed to fetch university dashboard data" });
    }
  });

  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const leaderboard = await storage.getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Get batch-specific leaderboard
  app.get("/api/leaderboard/batch/:batch", async (req, res) => {
    try {
      const { batch } = req.params;
      if (!["2027", "2028"].includes(batch)) {
        return res.status(400).json({ error: "Invalid batch. Must be 2027 or 2028" });
      }
      const leaderboard = await storage.getBatchLeaderboard(batch);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch batch leaderboard" });
    }
  });

  // Get university-wide leaderboard (combined batches)
  app.get("/api/leaderboard/university", async (req, res) => {
    try {
      const leaderboard = await storage.getUniversityLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch university leaderboard" });
    }
  });

  // Get all students with basic stats for directory
  app.get("/api/students/all", async (req, res) => {
    try {
      const adminData = await storage.getAdminDashboard();
      res.json(adminData.students);
    } catch (error) {
      console.error('Error fetching all students:', error);
      res.status(500).json({ error: 'Failed to fetch students' });
    }
  });

  // Get students by batch
  app.get("/api/students/batch/:batch", async (req, res) => {
    try {
      const { batch } = req.params;
      if (!["2027", "2028"].includes(batch)) {
        return res.status(400).json({ error: "Invalid batch. Must be 2027 or 2028" });
      }
      const batchData = await storage.getBatchDashboard(batch);
      res.json(batchData.students);
    } catch (error) {
      console.error('Error fetching batch students:', error);
      res.status(500).json({ error: 'Failed to fetch batch students' });
    }
  });

  // Get complete rankings for all students
  app.get("/api/rankings/all", async (req, res) => {
    try {
      const adminData = await storage.getAdminDashboard();
      
      // Sort students by total problems solved in descending order
      const rankedStudents = adminData.students
        .sort((a: any, b: any) => b.stats.totalSolved - a.stats.totalSolved)
        .map((student: any, index: number) => ({
          rank: index + 1,
          student: {
            id: student.id,
            name: student.name,
            leetcodeUsername: student.leetcodeUsername,
            leetcodeProfileLink: student.leetcodeProfileLink || `https://leetcode.com/u/${student.leetcodeUsername}/`,
            profilePhoto: student.profilePhoto,
            githubUsername: student.githubUsername
          },
          stats: student.stats,
          weeklyProgress: student.weeklyProgress,
          streak: student.streak,
          status: student.status,
          badges: student.badges?.length || 0
        }));

      res.json(rankedStudents);
    } catch (error) {
      console.error('Error fetching rankings:', error);
      res.status(500).json({ error: 'Failed to fetch rankings' });
    }
  });

  // Sync single student
  app.post("/api/sync/student/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await leetCodeService.syncStudentData(id);
      
      if (success) {
        res.json({ message: "Student data synced successfully" });
      } else {
        res.status(400).json({ error: "Failed to sync student data" });
      }
    } catch (error) {
      console.error('Error syncing student:', error);
      res.status(500).json({ error: "Failed to sync student data" });
    }
  });

  // Sync all students
  app.post("/api/sync/all", async (req, res) => {
    try {
      const result = await schedulerService.manualSync();
      res.json(result);
    } catch (error) {
      console.error('Error syncing all students:', error);
      res.status(500).json({ error: "Failed to sync all students" });
    }
  });

  // Sync profile photos from LeetCode
  app.post("/api/sync/profile-photos", async (req, res) => {
    try {
      const result = await leetCodeService.syncAllProfilePhotos();
      res.json({ 
        message: `Profile photos sync completed`, 
        success: result.success, 
        failed: result.failed 
      });
    } catch (error) {
      console.error('Error syncing profile photos:', error);
      res.status(500).json({ error: "Failed to sync profile photos" });
    }
  });

  // Export CSV
  app.get("/api/export/csv", async (req, res) => {
    try {
      const adminData = await storage.getAdminDashboard();
      
      // Create CSV content
      const headers = ['Name', 'LeetCode Username', 'Total Solved', 'Weekly Progress', 'Streak', 'Status'];
      const csvContent = [
        headers.join(','),
        ...adminData.students.map((student: any) => [
          `"${student.name}"`,
          student.leetcodeUsername,
          student.stats.totalSolved,
          student.weeklyProgress,
          student.streak,
          `"${student.status}"`
        ].join(','))
      ].join('\n');
      
      const date = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="leetcode-progress-${date}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });

  // Get app settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getAppSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Get all badges data
  app.get("/api/badges/all", async (req, res) => {
    try {
      const badgesData = await storage.getAllBadgesData();
      res.json(badgesData);
    } catch (error) {
      console.error('Error fetching badges data:', error);
      res.status(500).json({ error: "Failed to fetch badges data" });
    }
  });

  // Import students from CSV
  app.post("/api/import/csv", async (req, res) => {
    try {
      const csvFilePath = path.join(process.cwd(), 'attached_assets', 'LeetCode Details (2024-28) - Sheet1_1753877079641.csv');
      const result = await csvImportService.importFromCSV(csvFilePath);
      
      res.json({
        success: true,
        message: `Import completed: ${result.imported} students imported, ${result.skipped} skipped`,
        ...result
      });
    } catch (error) {
      console.error('CSV import error:', error);
      res.status(500).json({ error: `Failed to import CSV: ${error}` });
    }
  });

  // Import updated students data from new CSV format
  app.post("/api/import/updated-csv", async (req, res) => {
    try {
      const csvFilePath = path.join(process.cwd(), 'attached_assets', 'LEETCODE UPDATED DATA SHEET_1753968848855.csv');
      const result = await csvImportService.importUpdatedCSV(csvFilePath);
      
      res.json({
        success: true,
        message: `Update completed: ${result.updated} students updated, ${result.created} created, ${result.skipped} skipped`,
        ...result
      });
    } catch (error) {
      console.error('CSV update error:', error);
      res.status(500).json({ error: `Failed to update from CSV: ${error}` });
    }
  });

  // Import weekly progress data from CSV
  app.post("/api/import/weekly-progress", async (req, res) => {
    try {
      const csvFilePath = path.join(process.cwd(), 'attached_assets', 'batch of 28 leetcode_2_AUGUST_1754130719740.csv');
      const result = await weeklyProgressImportService.importWeeklyProgressFromCSV(csvFilePath);
      
      res.json({
        success: true,
        message: `Weekly progress import completed: ${result.imported} imported, ${result.updated} updated, ${result.skipped} skipped`,
        ...result
      });
    } catch (error) {
      console.error('Weekly progress import error:', error);
      res.status(500).json({ error: `Failed to import weekly progress data: ${error}` });
    }
  });

  // Get all weekly progress data
  app.get("/api/weekly-progress", async (req, res) => {
    try {
      const weeklyProgressData = await weeklyProgressImportService.getEnhancedWeeklyProgressData();
      res.json(weeklyProgressData);
    } catch (error) {
      console.error('Weekly progress fetch error:', error);
      res.status(500).json({ error: "Failed to fetch weekly progress data" });
    }
  });

  // Get specific student's weekly progress
  app.get("/api/weekly-progress/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const studentProgress = await weeklyProgressImportService.getStudentWeeklyProgress(username);
      
      if (!studentProgress) {
        return res.status(404).json({ error: "Student not found or no weekly progress data available" });
      }
      
      res.json(studentProgress);
    } catch (error) {
      console.error('Student weekly progress fetch error:', error);
      res.status(500).json({ error: "Failed to fetch student weekly progress data" });
    }
  });

  // Get analytics data with historical and real-time data
  app.get("/api/analytics", async (req, res) => {
    try {
      const analyticsData = await csvImportService.getAnalyticsData();
      
      // Calculate summary statistics
      const totalStudents = analyticsData.length;
      const improved = analyticsData.filter(s => s.status === 'improved').length;
      const declined = analyticsData.filter(s => s.status === 'declined').length;
      const same = analyticsData.filter(s => s.status === 'same').length;
      
      const averageImprovement = totalStudents > 0
        ? analyticsData.reduce((sum, s) => sum + s.improvement, 0) / totalStudents
        : 0;
      
      // Top 10 students for progress trend chart
      const top10Students = analyticsData
        .sort((a, b) => b.currentSolved - a.currentSolved)
        .slice(0, 10);
      
      // Top 15 students with most improvement
      const top15Improvers = analyticsData
        .filter(s => s.improvement > 0)
        .sort((a, b) => b.improvement - a.improvement)
        .slice(0, 15);
      
      // Calculate class average progression over time
      const classAverageProgression = calculateClassAverageProgression(analyticsData);
      
      res.json({
        summaryStats: {
          totalStudents,
          improved,
          declined,
          same,
          averageImprovement: Math.round(averageImprovement * 100) / 100
        },
        top10Students,
        top15Improvers,
        progressCategories: {
          improved,
          declined,
          same
        },
        classAverageProgression,
        allStudentsData: analyticsData
      });
      
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ error: "Failed to fetch analytics data" });
    }
  });

  // Start the scheduler
  schedulerService.startDailySync();

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to calculate class average progression
function calculateClassAverageProgression(analyticsData: any[]) {
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Current'];
  
  return weeks.map((week, index) => {
    let average = 0;
    
    if (index < 3) {
      // Historical weeks from CSV data
      const weekData = analyticsData.map(student => {
        const weeklyTrend = student.weeklyTrends[index];
        return weeklyTrend?.totalProblems || 0;
      });
      average = weekData.reduce((sum, val) => sum + val, 0) / weekData.length;
    } else {
      // Current week from real-time data
      const currentData = analyticsData.map(student => student.currentSolved);
      average = currentData.reduce((sum, val) => sum + val, 0) / currentData.length;
    }
    
    return {
      week,
      average: Math.round(average * 100) / 100
    };
  });
}
