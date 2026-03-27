import { jsPDF } from "jspdf";

const formatMonth = (m) => {
    if (!m) return "";
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
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


export const generateReceiptPDF_v11 = async (bills, filename = "Receipts.pdf") => {
    console.log("[PDFGen] Take 11 (Ultra-Defensive) starting...");
    try {
        const doc = new jsPDF();
        
        // Step 1: Font setup with extreme caution
        let fontData = null;
        try {
            fontData = await window.api.getFontData();
        } catch (err) {
            console.warn("[PDFGen] Font fetch IPC failed:", err);
        }

        const fontName = "NotoSansBengali";
        let hasCustomFont = false;

        if (fontData && fontData.length > 1000) { // Basic sanity check on length
            try {
                doc.addFileToVFS(`${fontName}.ttf`, fontData);
                doc.addFont(`${fontName}.ttf`, fontName, "normal");
                doc.setFont(fontName);
                hasCustomFont = true;
                console.log("[PDFGen] Custom font activated.");
            } catch (e) {
                console.error("[PDFGen] Font activation failed. Falling back to Helvetica.", e);
                doc.setFont("helvetica");
            }
        } else {
            console.warn("[PDFGen] No valid font data found. Using helvetica.");
            doc.setFont("helvetica");
        }

        const billsArray = Array.isArray(bills) ? bills : [bills];

        // Helper for safe text drawing (defending against 'widths' error in alignment)
        const safeText = (text, x, y, options = {}) => {
            try {
                // If we are using NotoSansBengali and align is center/right, 
                // we try it but catch if it fails
                doc.text(String(text), x, y, options);
            } catch (err) {
                console.warn(`[PDFGen] Alignment failed for "${text}":`, err.message);
                // Fallback: Default left alignment if complex alignment fails
                doc.text(String(text), x, y); 
            }
        };

        for (let i = 0; i < billsArray.length; i++) {
            const bill = billsArray[i];
            if (!bill) continue;

            const isSecond = i % 2 === 1;
            const y = isSecond ? 148.5 : 0;

            if (i > 0 && !isSecond) doc.addPage();

            // Divider line
            if (isSecond) {
                doc.setDrawColor(200);
                doc.setLineDashPattern([2, 2], 0);
                doc.line(10, y, 200, y);
                doc.setLineDashPattern([], 0);
            }

            // Header titles
            doc.setFontSize(22);
            doc.setTextColor(79, 70, 229);
            safeText("RentFlow", 105, y + 20, { align: "center" });
            
            doc.setFontSize(14);
            doc.setTextColor(100, 116, 139);
            safeText("মাসিক ভাড়ার রশিদ", 105, y + 30, { align: "center" });
            doc.setFontSize(12);
            safeText(`মাস: ${formatMonth(bill.month)}`, 105, y + 38, { align: "center" });

            // Renter Basic Info
            doc.setTextColor(0);
            doc.setFontSize(14);
            safeText(`ভাড়াটিয়া: ${String(bill.name || 'N/A')}`, 20, y + 50);
            safeText(`রুম নং: ${String(bill.room_number || 'N/A')}`, 20, y + 58);
            
            doc.setFontSize(11);
            doc.setTextColor(100);
            safeText(`রশিদ নং: #${String(bill.id || 'N/A')}`, 190, y + 50, { align: "right" });

            // Table Drawing Parameters
            let currentY = y + 65;
            const tableX = 20;
            const tableWidth = 170;
            const rowH = 8;
            const col2X = tableX + tableWidth - 5; 

            // 1. Table Header
            doc.setFillColor(79, 70, 229);
            doc.rect(tableX, currentY, tableWidth, rowH, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            safeText("বিবরণ", tableX + 5, currentY + 5.5);
            safeText("টাকা", col2X, currentY + 5.5, { align: "right" });
            currentY += rowH;

            // 2. Table Body Rows
            const rows = [
                { label: "বিদ্যুৎ বিল", val: (bill.electricity_bill || 0) },
                { label: "মাসিক ভাড়া", val: (bill.monthly_rent || 0) },
                { label: "টয়লেট খরচ", val: (bill.toilet_fee || 0) },
                { label: "ময়লা বিল", val: (bill.garbage_bill || 0) },
                { label: "রান্নাঘর বিল", val: (bill.kitchen_bill || 0) },
                { label: "সার্ভিস চার্জ", val: (bill.service_charge || 0) },
                { label: "বকেয়া", val: (bill.previous_due || 0) }
            ];

            doc.setTextColor(51, 65, 85);
            rows.forEach((row, idx) => {
                if (idx % 2 === 1) {
                    doc.setFillColor(248, 250, 252);
                    doc.rect(tableX, currentY, tableWidth, rowH, 'F');
                }
                safeText(String(row.label), tableX + 5, currentY + 5.5);
                const moneyStr = `${hasCustomFont ? '৳' : 'Tk.'}${Number(row.val).toLocaleString()}`;
                safeText(moneyStr, col2X, currentY + 5.5, { align: "right" });
                currentY += rowH;
            });

            // 3. Total Highlight Row
            doc.setFillColor(79, 70, 229);
            doc.rect(tableX, currentY, tableWidth, rowH + 2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            safeText("সর্বমোট পাওনা", tableX + 5, currentY + 6.5);
            const totalStr = `${hasCustomFont ? '৳' : 'Tk.'}${Number(bill.total_bill || 0).toLocaleString()}`;
            safeText(totalStr, col2X, currentY + 6.5, { align: "right" });
            currentY += rowH + 8;

            // Footer / Reading details
            doc.setFontSize(9);
            doc.setTextColor(148, 163, 184);
            const readingStr = `বিদ্যুৎ রিডিং: ${bill.previous_reading || 0} - ${bill.current_reading || 0} (${bill.units_used || 0} ইউনিট)`;
            safeText(readingStr, tableX, currentY);

            doc.setFontSize(9);
            safeText("ইনভয়েস ইস্যু করার ৭ দিনের মধ্যে ভাড়া পরিশোধ করুন।", 105, currentY + 12, { align: "center" });
            safeText("Generated by RentFlow", 105, currentY + 18, { align: "center" });
        }

        doc.save(filename);
        return true;
    } catch (error) {
        console.error("[PDFGen] Take 11 Critical Error:", error);
        alert("Critial Error: PDF generation failed. Error: " + error.message);
        return false;
    }
};

export const generateReceiptPDF_v10 = async (bills, filename = "Receipts.pdf") => {

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

            // Divider line
            if (isSecond) {
                doc.setDrawColor(200);
                doc.setLineDashPattern([2, 2], 0);
                doc.line(10, y, 200, y);
                doc.setLineDashPattern([], 0);
            }

            // Header titles (Centered manually)
            doc.setFontSize(22);
            doc.setTextColor(79, 70, 229);
            doc.text("RentFlow", 105, y + 20, { align: "center" });
            
            doc.setFontSize(14);
            doc.setTextColor(100, 116, 139);
            doc.text("মাসিক ভাড়ার রশিদ", 105, y + 30, { align: "center" });
            doc.setFontSize(12);
            doc.text(`মাস: ${formatMonth(bill.month)}`, 105, y + 38, { align: "center" });

            // Renter Basic Info
            doc.setTextColor(0);
            doc.setFontSize(14);
            doc.text(`ভাড়াটিয়া: ${String(bill.name || 'N/A')}`, 20, y + 50);
            doc.text(`রুম নং: ${String(bill.room_number || 'N/A')}`, 20, y + 58);
            
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`রশিদ নং: #${String(bill.id || 'N/A')}`, 190, y + 50, { align: "right" });

            // Table Drawing Parameters
            let currentY = y + 65;
            const tableX = 20;
            const tableWidth = 170;
            const rowH = 8;
            const col2X = tableX + tableWidth - 5; // Right aligned money column

            // 1. Table Header
            doc.setFillColor(79, 70, 229);
            doc.rect(tableX, currentY, tableWidth, rowH, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.text("বিবরণ", tableX + 5, currentY + 5.5);
            doc.text("টাকা", col2X, currentY + 5.5, { align: "right" });
            currentY += rowH;

            // 2. Table Body Rows
            const rows = [
                { label: "বিদ্যুৎ বিল", val: (bill.electricity_bill || 0) },
                { label: "মাসিক ভাড়া", val: (bill.monthly_rent || 0) },
                { label: "টয়লেট খরচ", val: (bill.toilet_fee || 0) },
                { label: "ময়লা বিল", val: (bill.garbage_bill || 0) },
                { label: "রান্নাঘর বিল", val: (bill.kitchen_bill || 0) },
                { label: "সার্ভিস চার্জ", val: (bill.service_charge || 0) },
                { label: "বকেয়া", val: (bill.previous_due || 0) }
            ];

            doc.setTextColor(51, 65, 85);
            rows.forEach((row, idx) => {
                if (idx % 2 === 1) {
                    doc.setFillColor(248, 250, 252);
                    doc.rect(tableX, currentY, tableWidth, rowH, 'F');
                }
                doc.text(String(row.label), tableX + 5, currentY + 5.5);
                const moneyStr = `৳${Number(row.val).toLocaleString()}`;
                doc.text(moneyStr, col2X, currentY + 5.5, { align: "right" });
                currentY += rowH;
            });

            // 3. Total Highlight Row
            doc.setFillColor(79, 70, 229);
            doc.rect(tableX, currentY, tableWidth, rowH + 2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.text("সর্বমোট পাওনা", tableX + 5, currentY + 6.5);
            const totalStr = `৳${Number(bill.total_bill || 0).toLocaleString()}`;
            doc.text(totalStr, col2X, currentY + 6.5, { align: "right" });
            currentY += rowH + 8;

            // Footer / Reading details
            doc.setFontSize(9);
            doc.setTextColor(148, 163, 184);
            const readingStr = `বিদ্যুৎ রিডিং: ${bill.previous_reading || 0} - ${bill.current_reading || 0} (${bill.units_used || 0} ইউনিট)`;
            doc.text(readingStr, tableX, currentY);

            doc.text("ইনভয়েস ইস্যু করার ৭ দিনের মধ্যে ভাড়া পরিশোধ করুন।", 105, currentY + 12, { align: "center" });
            doc.text("Generated by RentFlow", 105, currentY + 18, { align: "center" });
        }

        doc.save(filename);
        return true;
    } catch (error) {
        console.error("[PDFGen] Take 10 Critical Error:", error);
        alert("Wait! Generation failed with error: " + error.message);
        return false;
    }
};
