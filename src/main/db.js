import Database from "better-sqlite3";
import { app } from "electron";
import { join } from "path";
import fs from "fs";

let db;

export function initDb() {
  const userDataPath = app.getPath("userData");
  const dbPath = join(userDataPath, "মোল্লা নীড়.db");

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  // Create Renters Table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS renters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      room_number TEXT NOT NULL,
      monthly_rent REAL DEFAULT 0,
      toilet_fee REAL DEFAULT 0,
      garbage_bill REAL DEFAULT 0,
      kitchen_bill REAL DEFAULT 0,
      service_charge REAL DEFAULT 0,
      electricity_rate REAL DEFAULT 0,
      previous_reading REAL DEFAULT 0,
      current_reading REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `,
  ).run();

  // Create Monthly Bills Table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS monthly_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      renter_id INTEGER REFERENCES renters(id) ON DELETE CASCADE,
      month TEXT NOT NULL,
      previous_reading REAL,
      current_reading REAL,
      units_used REAL,
      electricity_bill REAL,
      monthly_rent REAL,
      toilet_fee REAL,
      garbage_bill REAL,
      kitchen_bill REAL,
      service_charge REAL,
      previous_due REAL DEFAULT 0,
      total_bill REAL,
      is_paid INTEGER DEFAULT 0,
      amount_paid REAL DEFAULT 0,
      payment_date TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `,
  ).run();

  // Add electricity_rate to monthly_bills if not exists
  try {
    db.prepare(
      "ALTER TABLE monthly_bills ADD COLUMN electricity_rate REAL DEFAULT 0",
    ).run();
  } catch (e) {
    // Column already exists
  }

  // Add amount_paid to monthly_bills if not exists
  try {
    db.prepare(
      "ALTER TABLE monthly_bills ADD COLUMN amount_paid REAL DEFAULT 0",
    ).run();
  } catch (e) {
    // Column already exists
  }

  // Add payment_date to monthly_bills if not exists
  try {
    db.prepare("ALTER TABLE monthly_bills ADD COLUMN payment_date TEXT").run();
  } catch (e) {
    // Column already exists
  }

  console.log("Database initialized at:", dbPath);
}

export function getDb() {
  if (!db) initDb();
  return db;
}
