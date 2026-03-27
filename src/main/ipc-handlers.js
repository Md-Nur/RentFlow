import { ipcMain, app } from "electron";
import { getDb } from "./db";
import fs from "fs";
import path from "path";

// Renter Handlers
ipcMain.handle("renters:getAll", () => {
  const db = getDb();
  return db.prepare("SELECT * FROM renters ORDER BY room_number ASC").all();
});

ipcMain.handle("renters:add", (_, renter) => {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO renters (name, room_number, monthly_rent, toilet_fee, garbage_bill, kitchen_bill, service_charge, electricity_rate, previous_reading)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    renter.name,
    renter.room_number,
    renter.monthly_rent || 0,
    renter.toilet_fee || 0,
    renter.garbage_bill || 0,
    renter.kitchen_bill || 0,
    renter.service_charge || 0,
    renter.electricity_rate || 0,
    renter.previous_reading || 0
  );
  return info.lastInsertRowid;
});

ipcMain.handle("renters:update", (_, renter) => {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE renters SET 
      name = ?, 
      room_number = ?, 
      monthly_rent = ?, 
      toilet_fee = ?, 
      garbage_bill = ?, 
      kitchen_bill = ?, 
      service_charge = ?, 
      electricity_rate = ?, 
      previous_reading = ?
    WHERE id = ?
  `);
  stmt.run(
    renter.name,
    renter.room_number,
    renter.monthly_rent,
    renter.toilet_fee,
    renter.garbage_bill,
    renter.kitchen_bill,
    renter.service_charge,
    renter.electricity_rate,
    renter.previous_reading,
    renter.id
  );
});

ipcMain.handle("renters:delete", (_, id) => {
  const db = getDb();
  db.prepare("DELETE FROM renters WHERE id = ?").run(id);
});

// Billing Handlers
ipcMain.handle("billing:saveBills", (_, { bills, month }) => {
  const db = getDb();
  const insertBill = db.prepare(`
    INSERT INTO monthly_bills (
      renter_id, month, previous_reading, current_reading, units_used, 
      electricity_bill, electricity_rate, monthly_rent, toilet_fee, garbage_bill, 
      kitchen_bill, service_charge, previous_due, total_bill
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateRenterReading = db.prepare(`
    UPDATE renters SET previous_reading = ? WHERE id = ?
  `);

  const transaction = db.transaction((billsData) => {
    for (const bill of billsData) {
      insertBill.run(
        bill.renter_id,
        month,
        bill.previous_reading,
        bill.current_reading,
        bill.units_used,
        bill.electricity_bill,
        bill.electricity_rate || 0,
        bill.monthly_rent,
        bill.toilet_fee,
        bill.garbage_bill,
        bill.kitchen_bill,
        bill.service_charge,
        bill.previous_due,
        bill.total_bill
      );
      // Update the renter's "previous_reading" to the new "current_reading" for next month
      updateRenterReading.run(bill.current_reading, bill.renter_id);
    }
  });

  transaction(bills);
});

ipcMain.handle("billing:getHistory", (_, month) => {
  const db = getDb();
  if (month) {
    return db.prepare(`
      SELECT b.*, r.name, r.room_number 
      FROM monthly_bills b
      JOIN renters r ON b.renter_id = r.id
      WHERE b.month = ?
    `).all(month);
  } else {
    return db.prepare(`
      SELECT b.*, r.name, r.room_number 
      FROM monthly_bills b
      JOIN renters r ON b.renter_id = r.id
      ORDER BY b.month DESC, r.room_number ASC
    `).all();
  }
});

// Analytics
ipcMain.handle("analytics:getSummary", () => {
  const db = getDb();
  const totalRenters = db.prepare("SELECT COUNT(*) as count FROM renters").get().count;
  const monthlyIncome = db.prepare(`
    SELECT month, SUM(total_bill) as total 
    FROM monthly_bills 
    GROUP BY month 
    ORDER BY month DESC 
    LIMIT 6
  `).all();

  return {
    totalRenters,
    monthlyIncome: monthlyIncome.reverse()
  };
});

// Font Handler
ipcMain.handle("billing:getFontData", async () => {
  const fontName = "NotoSansBengali-Regular.ttf";
  let fontPath;

  if (app.isPackaged) {
    fontPath = path.join(process.resourcesPath, "resources", fontName);
  } else {
    fontPath = path.join(app.getAppPath(), "resources", fontName);
  }

  // Fallback check if the first path fails
  if (!fs.existsSync(fontPath)) {
    fontPath = path.join(app.getAppPath(), "resources", fontName);
  }

  if (fs.existsSync(fontPath)) {
    return fs.readFileSync(fontPath).toString("base64");
  }
  
  console.error("Font not found at:", fontPath);
  return null;
});
