import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";

const sqlite = new Database('./database.sqlite');
export const db = drizzle(sqlite, { schema });

// Initialize database tables if they don't exist
const initTables = () => {
  try {
    // Create users table first
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        email TEXT UNIQUE,
        first_name TEXT,
        last_name TEXT,
        profile_image_url TEXT,
        role TEXT DEFAULT 'student',
        current_level TEXT DEFAULT 'Beginner',
        total_score INTEGER DEFAULT 0,
        questions_completed INTEGER DEFAULT 0,
        study_streak INTEGER DEFAULT 0,
        last_active_date INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);

    // Create sessions table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        sess TEXT NOT NULL,
        expire INTEGER NOT NULL
      );
    `);

    // Create exam_papers table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS exam_papers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        year INTEGER NOT NULL,
        level TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_url TEXT NOT NULL,
        status TEXT DEFAULT 'processing',
        total_questions INTEGER DEFAULT 0,
        uploaded_by TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      );
    `);

    // Create questions table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exam_paper_id INTEGER,
        question_number INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        subject TEXT NOT NULL,
        topic TEXT,
        difficulty TEXT DEFAULT 'medium',
        learning_outcome TEXT,
        ai_model_answer TEXT,
        ai_confidence REAL DEFAULT 0,
        is_verified INTEGER DEFAULT 0,
        verified_by TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (exam_paper_id) REFERENCES exam_papers(id),
        FOREIGN KEY (verified_by) REFERENCES users(id)
      );
    `);

    // Create student_answers table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS student_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT,
        question_id INTEGER,
        answer_text TEXT NOT NULL,
        score REAL NOT NULL,
        feedback TEXT,
        evaluation_details TEXT,
        time_spent INTEGER,
        attempts INTEGER DEFAULT 1,
        is_correct INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (student_id) REFERENCES users(id),
        FOREIGN KEY (question_id) REFERENCES questions(id)
      );
    `);

    // Create other tables
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        color TEXT,
        criteria TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );

      CREATE TABLE IF NOT EXISTS user_badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        badge_id INTEGER,
        earned_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (badge_id) REFERENCES badges(id)
      );

      CREATE TABLE IF NOT EXISTS study_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        questions_attempted INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        total_score REAL DEFAULT 0,
        avg_time_per_question REAL,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (student_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);

    // Insert default admin user if not exists
    const adminExists = sqlite.prepare("SELECT COUNT(*) as count FROM users WHERE id = 'admin'").get() as { count: number };
    if (adminExists.count === 0) {
      sqlite.prepare(`
        INSERT INTO users (id, email, first_name, last_name, role, created_at, updated_at)
        VALUES ('admin', 'admin@intellitutor.com', 'Admin', 'User', 'admin', ?, ?)
      `).run(Date.now(), Date.now());
      console.log('Default admin user created');
    }

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database tables:', error);
  }
};

// Initialize tables on startup
initTables();