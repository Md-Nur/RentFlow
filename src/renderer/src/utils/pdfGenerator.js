import { jsPDF } from "jspdf";

const formatMonth = (m) => {
  if (!m) return "";
  const months = [
    "জানুয়ারি",
    "ফেব্রুয়ারি",
    "মার্চ",
    "এপ্রিল",
    "মে",
    "জুন",
    "জুলাই",
    "আগস্ট",
    "সেপ্টেম্বর",
    "অক্টোবর",
    "নভেম্বর",
    "ডিসেম্বর",
  ];
  try {
    const parts = String(m).split("-");
    if (parts.length < 2) return String(m);
    const [year, month] = parts;
    const monthIdx = parseInt(month) - 1;
    if (isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) return String(m);
    return `${months[monthIdx]} ${year}`;
  } catch (e) {
    return String(m);
  }
};

// ─── v11: Minimal-ink, B&W printer-friendly ──────────────────────────────────
// Design principles:
//   • No filled rectangles (no solid black/gray backgrounds)
//   • Only thin lines (borders) and text
//   • Alternating rows avoided — horizontal rules only
//   • Two receipts per page separated by a dashed cut line
export const generateReceiptPDF_v11 = async (
  bills,
  filename = "Receipts.pdf",
) => {
  console.log("[PDFGen] v11 (Minimal Ink) starting...");
  try {
    const doc = new jsPDF();

    // ── Font setup ────────────────────────────────────────────
    let fontData = null;
    try {
      fontData = await window.api.getFontData();
    } catch (err) {
      console.warn("[PDFGen] Font fetch failed:", err);
    }

    const fontName = "NotoSansBengali";
    let hasCustomFont = false;
    if (fontData && fontData.length > 1000) {
      try {
        doc.addFileToVFS(`${fontName}.ttf`, fontData);
        doc.addFont(`${fontName}.ttf`, fontName, "normal");
        doc.setFont(fontName);
        hasCustomFont = true;
      } catch (e) {
        doc.setFont("helvetica");
      }
    } else {
      doc.setFont("helvetica");
    }

    const tk = (v) =>
      `${hasCustomFont ? "৳" : "Tk."}${Number(v || 0).toLocaleString()}`;

    const billsArray = Array.isArray(bills) ? bills : [bills];

    const safeText = (text, x, y, options = {}) => {
      try {
        doc.text(String(text), x, y, options);
      } catch (err) {
        doc.text(String(text), x, y);
      }
    };

    // Draw a single receipt starting at vertical offset `baseY`
    const drawReceipt = (bill, baseY) => {

      const L = 15; // left margin
      const R = 195; // right margin
      const W = R - L;
      let y = baseY + 8;

      // ── Title ─────────────────────────────────────────────
      doc.setFontSize(18);
      doc.setTextColor(0);
      safeText("মোল্লা নীড়", 105, y, { align: "center" });
      y += 6;

      doc.setFontSize(10);
      doc.setTextColor(60);
      safeText("মাসিক ভাড়ার রশিদ", 105, y, { align: "center" });
      y += 2;

      // Single rule under header
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(L, y, R, y);
      y += 5;

      // ── Renter info (two columns, text only) ─────────────
      doc.setFontSize(10);
      doc.setTextColor(0);
      safeText(`ভাড়াটিয়া: ${String(bill.name || "N/A")}`, L, y);
      safeText(`মাস: ${formatMonth(bill.month)}`, R, y, { align: "right" });
      y += 5;
      safeText(`রুম নং: ${String(bill.room_number || "N/A")}`, L, y);
      safeText(`রশিদ নং: #${String(bill.id || "N/A")}`, R, y, {
        align: "right",
      });
      y += 3;

      // Thin rule
      doc.setLineWidth(0.3);
      doc.line(L, y, R, y);
      y += 4;

      // ── Bill rows ─────────────────────────────────────────
      // Column header (bold, no fill)
      doc.setFontSize(9);
      doc.setTextColor(0);
      doc.setFont(hasCustomFont ? fontName : "helvetica", "bold");
      safeText("বিবরণ", L, y);
      safeText("টাকা", R, y, { align: "right" });
      y += 1.5;
      doc.setLineWidth(0.4);
      doc.line(L, y, R, y);
      y += 4;

      // Reset to normal weight
      doc.setFont(hasCustomFont ? fontName : "helvetica", "normal");

      const rows = [
        {
          label: `বিদ্যুৎ বিল (${bill.previous_reading || 0}→${bill.current_reading || 0}=${bill.units_used || 0} ইউ.)`,
          val: bill.electricity_bill,
        },
        { label: "মাসিক ভাড়া", val: bill.monthly_rent },
        { label: "টয়লেট খরচ", val: bill.toilet_fee },
        { label: "ময়লা বিল", val: bill.garbage_bill },
        { label: "রান্নাঘর বিল", val: bill.kitchen_bill },
        { label: "সার্ভিস চার্জ", val: bill.service_charge },
        { label: "বকেয়া (আগের)", val: bill.previous_due },
      ];

      const rowH = 6.5;
      doc.setFontSize(9);
      doc.setTextColor(0);
      rows.forEach((row) => {
        safeText(String(row.label), L, y);
        safeText(tk(row.val), R, y, { align: "right" });
        y += rowH;
        doc.setDrawColor(190);
        doc.setLineWidth(0.1);
        doc.line(L, y - 1.5, R, y - 1.5); // light separator
        doc.setDrawColor(0);
      });

      // Paid row (italic, no fill)
      if (bill.amount_paid > 0) {
        doc.setTextColor(0);
        safeText("জমা (Paid)", L, y);
        safeText(tk(bill.amount_paid), R, y, { align: "right" });
        y += rowH;
        doc.setDrawColor(190);
        doc.setLineWidth(0.1);
        doc.line(L, y - 1.5, R, y - 1.5);
        doc.setDrawColor(0);
      }

      // ── Total row (double rule + bold text, no fill) ──────
      doc.setLineWidth(0.5);
      doc.line(L, y, R, y);
      y += 1;
      doc.line(L, y, R, y); // double rule
      y += 5;
      doc.setFontSize(11);
      doc.setFont(hasCustomFont ? fontName : "helvetica", "bold");
      safeText("সর্বমোট পাওনা", L, y);
      safeText(tk(bill.total_bill), R, y, { align: "right" });
      doc.setFont(hasCustomFont ? fontName : "helvetica", "normal");
      y += 2;
      doc.setLineWidth(0.5);
      doc.line(L, y, R, y);
      y += 5;



      // ── Footer ────────────────────────────────────────────
      doc.setFontSize(8);
      doc.setTextColor(130);
      doc.setLineWidth(0.1);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(L, y - 1, R, y - 1);
      doc.setLineDashPattern([], 0);
      safeText(
        "ইনভয়েস ইস্যু করার ৭ দিনের মধ্যে ভাড়া পরিশোধ করুন।",
        105,
        y + 3,
        { align: "center" },
      );
    };

    for (let i = 0; i < billsArray.length; i++) {
      const bill = billsArray[i];
      if (!bill) continue;

      const isSecond = i % 2 === 1;
      const baseY = isSecond ? 148.5 : 0;

      if (i > 0 && !isSecond) doc.addPage();

      // Dashed cut line between two receipts on same page
      if (isSecond) {
        doc.setDrawColor(0);
        doc.setLineDashPattern([2, 2], 0);
        doc.line(10, baseY, 200, baseY);
        doc.setLineDashPattern([], 0);
        doc.setFontSize(7);
        doc.setTextColor(150);
        safeText("✂", 8, baseY + 1);
      }

      drawReceipt(bill, baseY);
    }

    doc.save(filename);
    return true;
  } catch (error) {
    console.error("[PDFGen] v11 Critical Error:", error);
    alert("Critical Error: PDF generation failed. Error: " + error.message);
    return false;
  }
};

// ─── v10: legacy (kept for reference) ───────────────────────────────────────
export const generateReceiptPDF_v10 = async (
  bills,
  filename = "Receipts.pdf",
) => {
  console.log("[PDFGen] Take 10 (Ultra-Safe Bengali) starting...");
  try {
    const doc = new jsPDF();

    // Step 1: Font setup
    let fontData = null;
    try {
      fontData = await window.api.getFontData();
    } catch (err) {
      console.warn("[PDFGen] Font fetch failed:", err);
    }

    if (fontData) {
      try {
        doc.addFileToVFS("NotoSansBengali.ttf", fontData);
        doc.addFont("NotoSansBengali.ttf", "NotoSansBengali", "normal");
        doc.setFont("NotoSansBengali");
      } catch (e) {
        console.warn("[PDFGen] Font activation failed:", e);
        doc.setFont("helvetica");
      }
    } else {
      doc.setFont("helvetica");
    }

    const billsArray = Array.isArray(bills) ? bills : [bills];

    for (let i = 0; i < billsArray.length; i++) {
      const bill = billsArray[i];
      if (!bill) continue;

      const isSecond = i % 2 === 1;
      const y = isSecond ? 148.5 : 0;

      if (i > 0 && !isSecond) doc.addPage();

      if (isSecond) {
        doc.setDrawColor(200);
        doc.setLineDashPattern([2, 2], 0);
        doc.line(10, y, 200, y);
        doc.setLineDashPattern([], 0);
      }

      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229);
      doc.text("মোল্লা নীড়", 105, y + 20, { align: "center" });

      doc.setFontSize(14);
      doc.setTextColor(100, 116, 139);
      doc.text("মাসিক ভাড়ার রশিদ", 105, y + 30, { align: "center" });
      doc.setFontSize(12);
      doc.text(`মাস: ${formatMonth(bill.month)}`, 105, y + 38, {
        align: "center",
      });

      doc.setTextColor(0);
      doc.setFontSize(14);
      doc.text(`ভাড়াটিয়া: ${String(bill.name || "N/A")}`, 20, y + 50);
      doc.text(`রুম নং: ${String(bill.room_number || "N/A")}`, 20, y + 58);

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`রশিদ নং: #${String(bill.id || "N/A")}`, 190, y + 50, {
        align: "right",
      });



      let currentY = y + 65;
      const tableX = 20;
      const tableWidth = 170;
      const rowH = 8;
      const col2X = tableX + tableWidth - 5;

      doc.setFillColor(79, 70, 229);
      doc.rect(tableX, currentY, tableWidth, rowH, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text("বিবরণ", tableX + 5, currentY + 5.5);
      doc.text("টাকা", col2X, currentY + 5.5, { align: "right" });
      currentY += rowH;

      const rows = [
        { label: "বিদ্যুৎ বিল", val: bill.electricity_bill || 0 },
        { label: "মাসিক ভাড়া", val: bill.monthly_rent || 0 },
        { label: "টয়লেট খরচ", val: bill.toilet_fee || 0 },
        { label: "ময়লা বিল", val: bill.garbage_bill || 0 },
        { label: "রান্নাঘর বিল", val: bill.kitchen_bill || 0 },
        { label: "সার্ভিস চার্জ", val: bill.service_charge || 0 },
        { label: "বকেয়া", val: bill.previous_due || 0 },
      ];

      doc.setTextColor(51, 65, 85);
      rows.forEach((row, idx) => {
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(tableX, currentY, tableWidth, rowH, "F");
        }
        doc.text(String(row.label), tableX + 5, currentY + 5.5);
        const moneyStr = `৳${Number(row.val).toLocaleString()}`;
        doc.text(moneyStr, col2X, currentY + 5.5, { align: "right" });
        currentY += rowH;
      });

      if (bill.amount_paid > 0) {
        doc.setFillColor(240, 253, 244);
        doc.rect(tableX, currentY, tableWidth, rowH, "F");
        doc.setTextColor(22, 163, 74);
        doc.setFontSize(10);
        doc.text("জমা (Paid Amount)", tableX + 5, currentY + 5.5);
        doc.text(
          `৳${Number(bill.amount_paid || 0).toLocaleString()}`,
          col2X,
          currentY + 5.5,
          { align: "right" },
        );
        currentY += rowH;
      }

      doc.setFillColor(79, 70, 229);
      doc.rect(tableX, currentY, tableWidth, rowH + 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text("সর্বমোট পাওনা", tableX + 5, currentY + 6.5);
      doc.text(
        `৳${Number(bill.total_bill || 0).toLocaleString()}`,
        col2X,
        currentY + 6.5,
        { align: "right" },
      );
      currentY += rowH + 8;

      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `বিদ্যুৎ রিডিং: ${bill.previous_reading || 0} - ${bill.current_reading || 0} (${bill.units_used || 0} ইউনিট)`,
        tableX,
        currentY,
      );
      doc.text(
        "ইনভয়েস ইস্যু করার ৭ দিনের মধ্যে ভাড়া পরিশোধ করুন।",
        105,
        currentY + 12,
        { align: "center" },
      );
      doc.text("Generated by মোল্লা নীড়", 105, currentY + 18, {
        align: "center",
      });
    }

    doc.save(filename);
    return true;
  } catch (error) {
    console.error("[PDFGen] Take 10 Critical Error:", error);
    alert("Wait! Generation failed with error: " + error.message);
    return false;
  }
};
