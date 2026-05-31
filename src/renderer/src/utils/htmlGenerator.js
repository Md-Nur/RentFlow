const formatMonth = (m) => {
  if (!m) return "";
  try {
    const [year, month] = m.split("-");
    const months = [
      "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
      "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
    ];
    return `${months[parseInt(month) - 1]} ${year}`;
  } catch (e) {
    return m;
  }
};

export const generateBillingHTML = (bills) => {
  let htmlContent = `<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>মোল্লা নীড় - ভাড়ার রশিদ</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Noto Sans Bengali', Arial, sans-serif;
            background: #fff;
            color: #000;
            padding: 10px;
            /* No color-adjust needed — no fills to preserve */
        }

        .container {
            max-width: 740px;
            margin: 0 auto;
        }

        /* ── Print button (hidden when printing) ── */
        .print-btn-container {
            display: flex;
            justify-content: center;
            gap: 12px;
            margin-bottom: 16px;
        }

        .btn {
            background: #000;
            color: #fff;
            border: none;
            padding: 9px 20px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .btn-secondary {
            background: #fff;
            color: #000;
            border: 1px solid #000;
        }

        /* ── Page: 2-column grid, 3 rows = 6 receipts ── */
        .page-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
            position: relative;
            page-break-inside: avoid;
            page-break-after: always;
            border: 1px solid #ccc;
            margin-bottom: 16px;
        }

        .page-container:last-child { page-break-after: avoid; }

        .page-container-single {
            display: flex;
            justify-content: center;
        }

        /* ── Single receipt card ── */
        .receipt {
            padding: 14px 16px;
            border-right: 1px dashed #aaa;
            border-bottom: 1px dashed #aaa;
            min-width: 0;
        }

        /* Remove right border on even columns (2nd, 4th, 6th) */
        .receipt:nth-child(2n) { border-right: none; }
        /* Remove bottom border on last row */
        .receipt:nth-last-child(-n+2) { border-bottom: none; }

        /* ── Header ── */
        .receipt-header {
            text-align: center;
            margin-bottom: 8px;
        }

        .receipt-title {
            font-size: 16px;
            font-weight: 900;
            letter-spacing: -0.02em;
        }

        .receipt-subtitle {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.08em;
            margin-top: 1px;
        }

        .header-rule {
            border: none;
            border-top: 1.5px solid #000;
            margin: 4px 0;
        }

        /* ── Renter / Month meta ── */
        .meta-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 9px;
        }

        .meta-label { color: #666; margin-bottom: 1px; }
        .meta-name  { font-weight: 700; font-size: 11px; }
        .meta-right { text-align: right; }

        /* ── Bill table ── */
        .bill-table {
            width: 100%;
            border: 1px solid #000;
            border-collapse: collapse;
            font-size: 9px;
            margin-bottom: 6px;
        }

        .bill-table th,
        .bill-table td {
            padding: 3px 6px;
            border-bottom: 1px solid #ddd;
            text-align: left;
        }

        .bill-table th {
            font-weight: 700;
            border-bottom: 1px solid #000;
            background: none;
        }

        .bill-table td:last-child,
        .bill-table th:last-child { text-align: right; }

        .row-paid {
            font-style: italic;
            border-top: 1px dashed #999 !important;
        }

        .row-remaining {
            text-decoration: underline;
            font-weight: 700;
        }

        .row-total td {
            font-weight: 900;
            font-size: 11px;
            border-top: 3px double #000 !important;
            border-bottom: none;
        }

        /* ── Status label ── */
        .status-label {
            text-align: center;
            font-weight: 700;
            font-size: 9px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            margin-bottom: 5px;
        }

        /* ── Footer ── */
        .receipt-footer {
            text-align: center;
            font-size: 8px;
            color: #777;
            font-style: italic;
            border-top: 1px dashed #bbb;
            padding-top: 4px;
        }

        /* ── Cut lines ── */
        .vertical-cut-line {
            position: absolute;
            top: 0; bottom: 0;
            left: 50%;
            border-left: 1px dashed #aaa;
            pointer-events: none;
        }

        .horizontal-cut-line-1,
        .horizontal-cut-line-2 {
            position: absolute;
            left: 0; right: 0;
            border-top: 1px dashed #aaa;
            pointer-events: none;
        }

        .horizontal-cut-line-1 { top: 33.33%; }
        .horizontal-cut-line-2 { top: 66.66%; }

        @media print {
            body { background: white; padding: 0; margin: 0; }
            .page-container {
                box-shadow: none;
                border: none;
                margin-bottom: 0;
                height: 100vh;
                box-sizing: border-box;
            }
            .print-btn-container { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="print-btn-container">
            <button onclick="window.print()" class="btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                প্রিন্ট করুন
            </button>
            <button onclick="window.close()" class="btn btn-secondary">বন্ধ করুন</button>
        </div>
`;

  // Process bills in groups of 6 (2 columns × 3 rows per page)
  for (let i = 0; i < bills.length; i += 6) {
    const pageBills = bills.slice(i, i + 6);
    const containerClass = pageBills.length === 1
      ? "page-container page-container-single"
      : "page-container";

    htmlContent += `        <div class="${containerClass}">\n`;

    pageBills.forEach((bill) => {
      const elecBill = bill.electricity_bill || 0;
      const rent     = bill.monthly_rent    || 0;
      const toilet   = bill.toilet_fee      || 0;
      const garbage  = bill.garbage_bill    || 0;
      const kitchen  = bill.kitchen_bill    || 0;
      const service  = bill.service_charge  || 0;
      const due      = bill.previous_due    || 0;
      const total    = bill.total_bill      || 0;
      const paid     = bill.amount_paid     || 0;
      const paidRow = paid > 0 ? `
                    <tr class="row-paid">
                        <td>জমা (Paid)</td>
                        <td>৳${paid.toLocaleString()}</td>
                    </tr>` : "";

      htmlContent += `            <div class="receipt">
                <div class="receipt-header">
                    <div class="receipt-title">মোল্লা নীড়</div>
                    <div class="receipt-subtitle">মাসিক ভাড়ার রশিদ</div>
                    <hr class="header-rule">
                </div>

                <div class="meta-info">
                    <div>
                        <div class="meta-label">ভাড়াটিয়া</div>
                        <div class="meta-name">${bill.name}</div>
                        <div>রুম নং: ${bill.room_number}</div>
                    </div>
                    <div class="meta-right">
                        <div class="meta-label">মাস / রশিদ নং</div>
                        <div class="meta-name">${formatMonth(bill.month)}</div>
                        <div>#${bill.id}</div>
                    </div>
                </div>

                <table class="bill-table">
                    <thead>
                        <tr>
                            <th>বিবরণ</th>
                            <th>টাকা</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>বিদ্যুৎ বিল (${bill.previous_reading || 0}→${bill.current_reading || 0}=${bill.units_used || 0} ইউ.)</td>
                            <td>৳${elecBill.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td>মাসিক ভাড়া</td>
                            <td>৳${rent.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td>টয়লেট খরচ</td>
                            <td>৳${toilet.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td>ময়লা বিল</td>
                            <td>৳${garbage.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td>রান্নাঘর বিল</td>
                            <td>৳${kitchen.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td>সার্ভিস চার্জ</td>
                            <td>৳${service.toLocaleString()}</td>
                        </tr>
                        <tr style="color:#555; border-top:1px dashed #aaa;">
                            <td>বকেয়া (আগের মাসের)</td>
                            <td>৳${due.toLocaleString()}</td>
                        </tr>${paidRow}
                        <tr class="row-total">
                            <td>সর্বমোট পাওনা</td>
                            <td>৳${total.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="receipt-footer">
                    ইনভয়েস ইস্যু করার ৭ দিনের মধ্যে ভাড়া পরিশোধ করুন।
                </div>
            </div>\n`;
    });

    // Cut lines
    if (pageBills.length >= 2) htmlContent += `            <div class="vertical-cut-line"></div>\n`;
    if (pageBills.length >= 3) htmlContent += `            <div class="horizontal-cut-line-1"></div>\n`;
    if (pageBills.length >= 5) htmlContent += `            <div class="horizontal-cut-line-2"></div>\n`;

    htmlContent += `        </div>\n`;
  }

  htmlContent += `    </div>
</body>
</html>`;

  return htmlContent;
};
