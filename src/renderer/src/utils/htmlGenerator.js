const formatMonth = (m) => {
    if (!m) return "";
    try {
        const [year, month] = m.split("-");
        const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
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
    <title>RentFlow Rent Receipts</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700;900&family=Outfit:wght@400;600;800&display=swap');
        
        :root {
            --primary: #4f46e5;
            --slate-50: #f8fafc;
            --slate-100: #f1f5f9;
            --slate-200: #e2e8f0;
            --slate-300: #cbd5e1;
            --slate-400: #94a3b8;
            --slate-600: #475569;
            --slate-700: #334155;
            --slate-900: #0f172a;
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: 'Noto Sans Bengali', 'Outfit', system-ui, -apple-system, sans-serif;
            background-color: var(--slate-100);
            margin: 0;
            padding: 10px;
            color: var(--slate-900);
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .container {
            max-width: 720px;
            margin: 0 auto;
        }

        .page-container {
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
            padding: 12px;
            margin-bottom: 16px;
            border: 1px solid var(--slate-200);
            page-break-inside: avoid;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto auto auto;
            gap: 10px 20px;
            position: relative;
        }

        .receipt {
            min-width: 0;
            max-width: 340px;
            position: relative;
        }

        /* Adjustments when there is a single centered receipt */
        .page-container-single {
            display: flex;
            justify-content: center;
        }

        .receipt-header {
            text-align: center;
            margin-bottom: 6px;
        }

        .receipt-header h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 18px;
            font-weight: 800;
            color: var(--primary);
            margin: 0;
            letter-spacing: -0.05em;
            text-transform: uppercase;
        }

        .receipt-header p {
            color: var(--slate-600);
            font-size: 10px;
            font-weight: 700;
            margin: 1px 0 0 0;
        }

        .meta-info {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 6px;
        }

        .meta-group h3 {
            font-size: 12px;
            font-weight: 700;
            margin: 1px 0;
        }

        .meta-group p {
            color: var(--slate-600);
            margin: 1px 0;
            font-size: 9px;
        }

        .meta-label {
            font-size: 8px;
            font-weight: 700;
            color: var(--slate-400);
            text-transform: uppercase;
            margin: 0;
        }

        .meta-right {
            text-align: right;
        }

        .bill-table {
            border: 1px solid var(--slate-200);
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 6px;
        }

        .table-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 8px;
            font-size: 9.5px;
            border-bottom: 1px solid var(--slate-100);
        }

        .table-row:last-child {
            border-bottom: none;
        }

        .table-header {
            background-color: var(--slate-50);
            font-weight: 700;
            color: var(--slate-700);
            border-bottom: 1px solid var(--slate-200);
        }

        .table-row-striped:nth-child(even) {
            background-color: #fafafa;
        }

        .total-row {
            background-color: var(--primary);
            color: white;
            padding: 6px 8px;
            font-weight: 700;
            font-size: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .total-amount {
            font-size: 13px;
            font-weight: 900;
        }

        .receipt-footer {
            text-align: center;
            font-size: 8px;
            color: var(--slate-400);
            font-style: italic;
            border-top: 1px solid var(--slate-100);
            padding-top: 4px;
        }

        /* Divider lines for 6-in-1 grid */
        .vertical-cut-line {
            position: absolute;
            top: 12px;
            bottom: 12px;
            left: 50%;
            border-left: 1px dashed var(--slate-300);
            transform: translateX(-50%);
            pointer-events: none;
        }

        .vertical-cut-line::after {
            content: "✂";
            position: absolute;
            top: 15px;
            left: -7px;
            background: white;
            padding: 2px 0;
            color: var(--slate-400);
            font-size: 11px;
        }

        .horizontal-cut-line-1 {
            position: absolute;
            left: 12px;
            right: 12px;
            top: 33.33%;
            border-top: 1px dashed var(--slate-300);
            transform: translateY(-50%);
            pointer-events: none;
        }

        .horizontal-cut-line-1::after {
            content: "✂";
            position: absolute;
            left: 20px;
            top: -9px;
            background: white;
            padding: 0 4px;
            color: var(--slate-400);
            font-size: 11px;
        }

        .horizontal-cut-line-2 {
            position: absolute;
            left: 12px;
            right: 12px;
            top: 66.66%;
            border-top: 1px dashed var(--slate-300);
            transform: translateY(-50%);
            pointer-events: none;
        }

        .horizontal-cut-line-2::after {
            content: "✂";
            position: absolute;
            left: 20px;
            top: -9px;
            background: white;
            padding: 0 4px;
            color: var(--slate-400);
            font-size: 11px;
        }

        .print-btn-container {
            display: flex;
            justify-content: center;
            gap: 12px;
            margin-bottom: 15px;
        }

        .btn {
            background-color: var(--primary);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 2px 4px rgba(79, 70, 229, 0.1);
            transition: all 0.2s;
        }

        .btn:hover {
            background-color: #4338ca;
            transform: translateY(-1px);
        }

        .btn-secondary {
            background-color: white;
            color: var(--slate-700);
            border: 1px solid var(--slate-300);
            box-shadow: none;
        }

        .btn-secondary:hover {
            background-color: var(--slate-50);
            color: var(--slate-900);
        }

        @media print {
            body {
                background-color: white;
                padding: 0;
                margin: 0;
            }
            .page-container {
                box-shadow: none;
                padding: 12px 0;
                margin-bottom: 0;
                border: none;
                page-break-after: always;
                break-after: page;
                height: 100vh;
                box-sizing: border-box;
                gap: 10px 20px;
            }
            .page-container:last-child {
                page-break-after: avoid;
                break-after: avoid;
            }
            .print-btn-container {
                display: none !important;
            }
            
            /* Align absolute cut lines correctly in full height on paper */
            .vertical-cut-line {
                top: 0;
                bottom: 0;
            }
            .horizontal-cut-line-1,
            .horizontal-cut-line-2 {
                left: 0;
                right: 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="print-btn-container">
            <button onclick="window.print()" class="btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                প্রিন্ট করুন
            </button>
            <button onclick="window.close()" class="btn btn-secondary">
                বন্ধ করুন
            </button>
        </div>
`;

    // Process bills in groups of 6
    for (let i = 0; i < bills.length; i += 6) {
        const pageBills = bills.slice(i, i + 6);
        const containerClass = pageBills.length === 1 ? 'page-container page-container-single' : 'page-container';
        htmlContent += `        <div class="${containerClass}">\n`;
        
        pageBills.forEach((bill) => {
            const elecBill = bill.electricity_bill || 0;
            const rent = bill.monthly_rent || 0;
            const toilet = bill.toilet_fee || 0;
            const garbage = bill.garbage_bill || 0;
            const kitchen = bill.kitchen_bill || 0;
            const service = bill.service_charge || 0;
            const due = bill.previous_due || 0;
            const total = bill.total_bill || 0;

            htmlContent += `            <div class="receipt">
                <div class="receipt-header">
                    <h1>RentFlow</h1>
                    <p>মাসিক ভাড়ার রশিদ</p>
                </div>

                <div class="meta-info">
                    <div class="meta-group">
                        <p class="meta-label">ভাড়াটিয়া</p>
                        <h3>${bill.name}</h3>
                        <p>রুম নং: ${bill.room_number}</p>
                    </div>
                    <div class="meta-group meta-right">
                        <p class="meta-label">মাস</p>
                        <h3>${formatMonth(bill.month)}</h3>
                        <p style="font-style: italic;">রশিদ নং: #${bill.id}</p>
                    </div>
                </div>

                <div class="bill-table">
                    <div class="table-row table-header">
                        <span>বিবরণ</span>
                        <span>টাকা</span>
                    </div>
                    <div class="table-row table-row-striped">
                        <span>বিদ্যুৎ বিল (${bill.previous_reading || 0} - ${bill.current_reading || 0} = ${bill.units_used || 0} ইউনিট)</span>
                        <span style="font-weight: 600;">৳${elecBill.toLocaleString()}</span>
                    </div>
                    <div class="table-row table-row-striped">
                        <span>মাসিক ভাড়া</span>
                        <span style="font-weight: 600;">৳${rent.toLocaleString()}</span>
                    </div>
                    <div class="table-row table-row-striped">
                        <span>টয়লেট খরচ</span>
                        <span style="font-weight: 600;">৳${toilet.toLocaleString()}</span>
                    </div>
                    <div class="table-row table-row-striped">
                        <span>ময়লা বিল</span>
                        <span style="font-weight: 600;">৳${garbage.toLocaleString()}</span>
                    </div>
                    <div class="table-row table-row-striped">
                        <span>রান্নাঘর বিল</span>
                        <span style="font-weight: 600;">৳${kitchen.toLocaleString()}</span>
                    </div>
                    <div class="table-row table-row-striped">
                        <span>সার্ভিস চার্জ</span>
                        <span style="font-weight: 600;">৳${service.toLocaleString()}</span>
                    </div>
                    <div class="table-row table-row-striped" style="color: var(--slate-400); border-top: 1px solid var(--slate-200);">
                        <span>বকেয়া (গত মাসের)</span>
                        <span>৳${due.toLocaleString()}</span>
                    </div>
                    <div class="total-row">
                        <span>সর্বমোট পাওনা</span>
                        <span class="total-amount">৳${total.toLocaleString()}</span>
                    </div>
                </div>

                <div class="receipt-footer">
                    ইনভয়েস ইস্যু করার ৭ দিনের মধ্যে ভাড়া পরিশোধ করুন। এই রশিদটি আপনার রেকর্ডের জন্য সংগ্রহে রাখুন।
                </div>
            </div>\n`;
        });
        
        // Render cut lines selectively based on amount of content on the page
        if (pageBills.length >= 2) {
            htmlContent += `            <div class="vertical-cut-line"></div>\n`;
        }
        if (pageBills.length >= 3) {
            htmlContent += `            <div class="horizontal-cut-line-1"></div>\n`;
        }
        if (pageBills.length >= 5) {
            htmlContent += `            <div class="horizontal-cut-line-2"></div>\n`;
        }
        
        htmlContent += `        </div>\n`;
    }

    htmlContent += `    </div>
</body>
</html>`;

    return htmlContent;
};
