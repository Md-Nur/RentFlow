import { ipcMain, app, dialog } from "electron";
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
    renter.previous_reading || 0,
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
    renter.id,
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
        bill.total_bill,
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
    return db
      .prepare(
        `
      SELECT b.*, r.name, r.room_number 
      FROM monthly_bills b
      JOIN renters r ON b.renter_id = r.id
      WHERE b.month = ?
    `,
      )
      .all(month);
  } else {
    return db
      .prepare(
        `
      SELECT b.*, r.name, r.room_number 
      FROM monthly_bills b
      JOIN renters r ON b.renter_id = r.id
      ORDER BY b.month DESC, r.room_number ASC
    `,
      )
      .all();
  }
});

ipcMain.handle(
  "billing:updatePayment",
  (_, { billId, amountPaid, isPaid, paymentDate }) => {
    const db = getDb();
    return db
      .prepare(
        `
    UPDATE monthly_bills 
    SET amount_paid = ?, is_paid = ?, payment_date = ? 
    WHERE id = ?
  `,
      )
      .run(amountPaid, isPaid, paymentDate, billId);
  },
);

ipcMain.handle("billing:getLatestDues", () => {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT renter_id, total_bill, amount_paid, is_paid, month 
    FROM monthly_bills 
    WHERE id IN (
      SELECT MAX(id) 
      FROM monthly_bills 
      GROUP BY renter_id
    )
  `,
    )
    .all();
});

// Analytics
ipcMain.handle("analytics:getSummary", () => {
  const db = getDb();
  const totalRenters = db
    .prepare("SELECT COUNT(*) as count FROM renters")
    .get().count;
  const monthlyIncome = db
    .prepare(
      `
    SELECT month, SUM(total_bill) as total 
    FROM monthly_bills 
    GROUP BY month 
    ORDER BY month DESC 
    LIMIT 6
  `,
    )
    .all();

  return {
    totalRenters,
    monthlyIncome: monthlyIncome.reverse(),
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

// Save HTML File Handler
ipcMain.handle("billing:saveHTML", async (_, { htmlContent, filename }) => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      defaultPath: filename,
      filters: [{ name: "HTML Files", extensions: ["html"] }],
    });
    if (filePath) {
      fs.writeFileSync(filePath, htmlContent, "utf-8");
      return { success: true, filePath };
    }
    return { success: false, reason: "cancelled" };
  } catch (err) {
    console.error("Failed to save HTML file:", err);
    return { success: false, error: err.message };
  }
});

// Export Data Handler
ipcMain.handle("db:exportData", async () => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      defaultPath: `মোল্লা নীড়_Backup_${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: "JSON Files", extensions: ["json"] }],
    });

    if (!filePath) return { success: false, reason: "cancelled" };

    const db = getDb();
    const renters = db.prepare("SELECT * FROM renters").all();
    const bills = db.prepare("SELECT * FROM monthly_bills").all();

    const data = {
      version: "1.0",
      renters,
      monthly_bills: bills,
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return { success: true, filePath };
  } catch (err) {
    console.error("Export failed:", err);
    return { success: false, error: err.message };
  }
});

// Import & Merge Data Handler
ipcMain.handle("db:importData", async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "JSON Files", extensions: ["json"] }],
    });

    if (!filePaths || filePaths.length === 0)
      return { success: false, reason: "cancelled" };

    const filePath = filePaths[0];
    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);

    if (!data.renters || !data.monthly_bills) {
      throw new Error(
        "Invalid backup file format. Missing renters or monthly_bills data.",
      );
    }

    const db = getDb();

    // Perform import inside a transaction for complete safety
    const transaction = db.transaction(() => {
      // 1. Fetch current renters to map room_number -> id
      const currentRentersList = db
        .prepare("SELECT id, room_number FROM renters")
        .all();
      const roomToIdMap = {};
      currentRentersList.forEach((r) => {
        roomToIdMap[r.room_number] = r.id;
      });

      const renterIdMap = {}; // Maps imported renter ID -> local DB renter ID

      const insertRenter = db.prepare(`
        INSERT INTO renters (name, room_number, monthly_rent, toilet_fee, garbage_bill, kitchen_bill, service_charge, electricity_rate, previous_reading)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const updateRenter = db.prepare(`
        UPDATE renters SET 
          name = ?, 
          monthly_rent = ?, 
          toilet_fee = ?, 
          garbage_bill = ?, 
          kitchen_bill = ?, 
          service_charge = ?, 
          electricity_rate = ?, 
          previous_reading = ?
        WHERE id = ?
      `);

      for (const renter of data.renters) {
        const existingId = roomToIdMap[renter.room_number];
        if (existingId !== undefined) {
          // Renter exists. Update their details and map ID
          updateRenter.run(
            renter.name,
            renter.monthly_rent || 0,
            renter.toilet_fee || 0,
            renter.garbage_bill || 0,
            renter.kitchen_bill || 0,
            renter.service_charge || 0,
            renter.electricity_rate || 0,
            renter.previous_reading || 0,
            existingId,
          );
          renterIdMap[renter.id] = existingId;
        } else {
          // Renter does not exist. Insert new renter
          const info = insertRenter.run(
            renter.name,
            renter.room_number,
            renter.monthly_rent || 0,
            renter.toilet_fee || 0,
            renter.garbage_bill || 0,
            renter.kitchen_bill || 0,
            renter.service_charge || 0,
            renter.electricity_rate || 0,
            renter.previous_reading || 0,
          );
          renterIdMap[renter.id] = info.lastInsertRowid;
        }
      }

      // 2. Fetch current bills to check duplicates (renter_id + month)
      const currentBills = db
        .prepare("SELECT id, renter_id, month FROM monthly_bills")
        .all();
      const billDuplicateMap = {}; // "renterId_month" -> bill_id
      currentBills.forEach((b) => {
        billDuplicateMap[`${b.renter_id}_${b.month}`] = b.id;
      });

      const insertBill = db.prepare(`
        INSERT INTO monthly_bills (
          renter_id, month, previous_reading, current_reading, units_used, 
          electricity_bill, electricity_rate, monthly_rent, toilet_fee, garbage_bill, 
          kitchen_bill, service_charge, previous_due, total_bill, is_paid, amount_paid, payment_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const updateBill = db.prepare(`
        UPDATE monthly_bills SET 
          previous_reading = ?, 
          current_reading = ?, 
          units_used = ?, 
          electricity_bill = ?, 
          electricity_rate = ?, 
          monthly_rent = ?, 
          toilet_fee = ?, 
          garbage_bill = ?, 
          kitchen_bill = ?, 
          service_charge = ?, 
          previous_due = ?, 
          total_bill = ?, 
          is_paid = ?, 
          amount_paid = ?, 
          payment_date = ?
        WHERE id = ?
      `);

      for (const bill of data.monthly_bills) {
        const localRenterId = renterIdMap[bill.renter_id];
        if (!localRenterId) {
          console.warn(
            `Skipping bill id ${bill.id} because renter ID ${bill.renter_id} could not be mapped.`,
          );
          continue;
        }

        const duplicateKey = `${localRenterId}_${bill.month}`;
        const existingBillId = billDuplicateMap[duplicateKey];

        if (existingBillId !== undefined) {
          // Bill exists for this renter and month. Update it.
          updateBill.run(
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
            bill.total_bill,
            bill.is_paid || 0,
            bill.amount_paid || 0,
            bill.payment_date,
            existingBillId,
          );
        } else {
          // Bill doesn't exist. Insert it.
          insertBill.run(
            localRenterId,
            bill.month,
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
            bill.total_bill,
            bill.is_paid || 0,
            bill.amount_paid || 0,
            bill.payment_date,
          );
        }
      }
    });

    transaction();
    return { success: true };
  } catch (err) {
    console.error("Import failed:", err);
    return { success: false, error: err.message };
  }
});
