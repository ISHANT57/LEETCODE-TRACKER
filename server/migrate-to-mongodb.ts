
import { Pool } from '@neondatabase/serverless';
import { connectMongoDB } from './mongodb';
import { storage } from './storage';

interface PostgreSQLStudent {
  id: string;
  name: string;
  leetcode_username: string;
  leetcode_profile_link: string;
  batch: string;
  created_at: Date;
}

interface PostgreSQLDailyProgress {
  id: string;
  student_id: string;
  date: string;
  total_solved: number;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
  daily_increment: number;
  created_at: Date;
}

interface PostgreSQLWeeklyTrend {
  id: string;
  student_id: string;
  week_start: string;
  week_end: string;
  total_problems: number;
  weekly_increment: number;
  ranking: number;
  created_at: Date;
}

interface PostgreSQLBadge {
  id: string;
  student_id: string;
  badge_type: string;
  title: string;
  description: string;
  icon: string;
  earned_at: Date;
}

async function migrateFromPostgreSQL() {
  console.log('Starting migration from PostgreSQL to MongoDB...');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set for PostgreSQL connection');
  }

  // Connect to PostgreSQL
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Connect to MongoDB
    await connectMongoDB();
    console.log('Connected to both PostgreSQL and MongoDB');

    // Migrate Students
    console.log('Migrating students...');
    const studentsResult = await pool.query('SELECT * FROM students ORDER BY created_at');
    const students = studentsResult.rows as PostgreSQLStudent[];
    
    for (const student of students) {
      try {
        await storage.createStudent({
          name: student.name,
          leetcodeUsername: student.leetcode_username,
          leetcodeProfileLink: student.leetcode_profile_link,
          batch: (student.batch === "2027" || student.batch === "2028") ? student.batch : "2028",
        });
        console.log(`✓ Migrated student: ${student.name}`);
      } catch (error) {
        console.error(`✗ Failed to migrate student ${student.name}:`, error);
      }
    }
    console.log(`Students migration completed: ${students.length} students`);

    // Get student ID mapping for foreign key relationships
    const studentIdMap = new Map<string, string>();
    const mongoStudents = await storage.getAllStudents();
    
    for (const pgStudent of students) {
      const mongoStudent = mongoStudents.find(s => s.leetcodeUsername === pgStudent.leetcode_username);
      if (mongoStudent) {
        studentIdMap.set(pgStudent.id, mongoStudent.id);
      }
    }

    // Migrate Daily Progress
    console.log('Migrating daily progress...');
    const progressResult = await pool.query('SELECT * FROM daily_progress ORDER BY created_at');
    const progressRecords = progressResult.rows as PostgreSQLDailyProgress[];
    
    for (const progress of progressRecords) {
      const mongoStudentId = studentIdMap.get(progress.student_id);
      if (mongoStudentId) {
        try {
          await storage.createDailyProgress({
            studentId: mongoStudentId,
            date: progress.date,
            totalSolved: progress.total_solved,
            easySolved: progress.easy_solved,
            mediumSolved: progress.medium_solved,
            hardSolved: progress.hard_solved,
            dailyIncrement: progress.daily_increment
          });
        } catch (error) {
          console.error(`✗ Failed to migrate progress for ${progress.date}:`, error);
        }
      }
    }
    console.log(`Daily progress migration completed: ${progressRecords.length} records`);

    // Migrate Weekly Trends
    console.log('Migrating weekly trends...');
    const trendsResult = await pool.query('SELECT * FROM weekly_trends ORDER BY created_at');
    const trends = trendsResult.rows as PostgreSQLWeeklyTrend[];
    
    for (const trend of trends) {
      const mongoStudentId = studentIdMap.get(trend.student_id);
      if (mongoStudentId) {
        try {
          await storage.createWeeklyTrend({
            studentId: mongoStudentId,
            weekStart: trend.week_start,
            weekEnd: trend.week_end,
            totalProblems: trend.total_problems,
            weeklyIncrement: trend.weekly_increment,
            ranking: trend.ranking
          });
        } catch (error) {
          console.error(`✗ Failed to migrate trend for week ${trend.week_start}:`, error);
        }
      }
    }
    console.log(`Weekly trends migration completed: ${trends.length} records`);

    // Migrate Badges
    console.log('Migrating badges...');
    const badgesResult = await pool.query('SELECT * FROM badges ORDER BY earned_at');
    const badges = badgesResult.rows as PostgreSQLBadge[];
    
    for (const badge of badges) {
      const mongoStudentId = studentIdMap.get(badge.student_id);
      if (mongoStudentId) {
        try {
          await storage.createBadge({
            studentId: mongoStudentId,
            badgeType: badge.badge_type,
            title: badge.title,
            description: badge.description,
            icon: badge.icon
          });
        } catch (error) {
          console.error(`✗ Failed to migrate badge ${badge.title}:`, error);
        }
      }
    }
    console.log(`Badges migration completed: ${badges.length} records`);

    console.log('🎉 Migration completed successfully!');
    console.log(`Total migrated:
    - Students: ${students.length}
    - Daily Progress: ${progressRecords.length}
    - Weekly Trends: ${trends.length}
    - Badges: ${badges.length}`);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateFromPostgreSQL()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateFromPostgreSQL };
