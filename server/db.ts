import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('damas.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function initDb() {
  // Users Table
  // Note: We cannot easily alter the CHECK constraint for roles on an existing table in SQLite.
  // We will rely on application-level validation for the 'comptable' role for existing databases.
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL, 
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Orders Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL,
      client_phone TEXT,
      commune TEXT NOT NULL,
      product TEXT DEFAULT 'البوكس الفاخر داماس',
      box_size TEXT CHECK(box_size IN ('صغير', 'متوسط', 'كبير')) NOT NULL,
      box_count INTEGER DEFAULT 1,
      amount REAL NOT NULL,
      status TEXT CHECK(status IN ('pending', 'delivering', 'delivered', 'failed')) DEFAULT 'pending',
      failure_reason TEXT,
      driver_id INTEGER,
      notes TEXT,
      driver_notes TEXT,
      admin_confirmed INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (driver_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Migrations for existing tables
  try {
    db.exec('ALTER TABLE orders ADD COLUMN driver_notes TEXT');
  } catch (e) {}
  try {
    db.exec('ALTER TABLE orders ADD COLUMN admin_confirmed INTEGER DEFAULT 0');
    db.exec("UPDATE orders SET admin_confirmed = 1 WHERE status = 'delivered'");
  } catch (e) {}
  try {
    db.exec('ALTER TABLE orders ADD COLUMN client_phone TEXT');
  } catch (e) {}
  try {
    db.exec('ALTER TABLE orders ADD COLUMN box_count INTEGER DEFAULT 1');
  } catch (e) {}
  try {
    db.exec('ALTER TABLE orders ADD COLUMN failure_reason TEXT');
  } catch (e) {}

  // Daily Stock Table - Recreating to support multiple sizes
  // We will check if the new columns exist, if not we might need to migrate or just add them.
  // Simpler approach for this dev environment: Add columns if missing.
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER NOT NULL,
      quantity_small INTEGER DEFAULT 0,
      quantity_medium INTEGER DEFAULT 0,
      quantity_large INTEGER DEFAULT 0,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (driver_id) REFERENCES users(id)
    )
  `);

  try {
    db.exec('ALTER TABLE daily_stock ADD COLUMN quantity_small INTEGER DEFAULT 0');
    db.exec('ALTER TABLE daily_stock ADD COLUMN quantity_medium INTEGER DEFAULT 0');
    db.exec('ALTER TABLE daily_stock ADD COLUMN quantity_large INTEGER DEFAULT 0');
    // If these succeed, we might want to migrate the old 'quantity' to 'quantity_medium' or just leave it.
    // For now, we'll just ignore the old 'quantity' column in the new logic.
  } catch (e) {
    // Columns likely exist
  }

  // Seed Super Admin if not exists
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('damassweetdz@gmail.com');
  
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('damass', 10);
    db.prepare(`
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `).run('Super Admin', 'damassweetdz@gmail.com', hashedPassword, 'admin');
    console.log('Super Admin created: damassweetdz@gmail.com / damass');
  }
}

export default db;
