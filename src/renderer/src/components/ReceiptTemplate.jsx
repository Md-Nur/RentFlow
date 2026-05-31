import React from "react";

const ReceiptTemplate = ({ bill, compact = false }) => {
    const formatMonth = (m) => {
        if (!m) return "";
        const [year, month] = m.split("-");
        const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
        return `${months[parseInt(month) - 1]} ${year}`;
    };



    const rows = [
        { label: `বিদ্যুৎ বিল (${bill.previous_reading || 0}→${bill.current_reading || 0}=${bill.units_used || 0} ইউনিট)`, val: bill.electricity_bill },
        { label: "মাসিক ভাড়া",   val: bill.monthly_rent },
        { label: "টয়লেট খরচ",   val: bill.toilet_fee },
        { label: "ময়লা বিল",     val: bill.garbage_bill },
        { label: "রান্নাঘর বিল",  val: bill.kitchen_bill },
        { label: "সার্ভিস চার্জ", val: bill.service_charge },
        { label: "বকেয়া (আগের)", val: bill.previous_due },
    ];

    const pad = compact ? "px-4 py-1" : "px-4 py-2";

    return (
        <div
            className={`bg-white text-black printable-receipt ${compact ? "p-4 border-b border-dashed border-gray-400 last:border-0" : "p-8"}`}
            style={{ fontFamily: "Arial, sans-serif" }}
        >
            {/* ── Header: text only, no fills ── */}
            <div className={`text-center ${compact ? "mb-3" : "mb-5"}`}>
                <div className={`font-black tracking-tight ${compact ? "text-xl" : "text-3xl"}`}>মোল্লা নীড়</div>
                <div className={`font-semibold tracking-widest ${compact ? "text-xs" : "text-sm"} mt-0.5`}>মাসিক ভাড়ার রশিদ</div>
                <div style={{ borderBottom: "1.5px solid black", marginTop: "4px" }} />
            </div>

            {/* ── Renter / Month info ── */}
            <div className={`flex justify-between ${compact ? "mb-3 text-sm" : "mb-4 text-base"}`}>
                <div>
                    <div className="text-xs" style={{ color: "#555" }}>ভাড়াটিয়া</div>
                    <div className="font-bold">{bill.name}</div>
                    <div className="text-xs">রুম নং: {bill.room_number}</div>
                </div>
                <div className="text-right">
                    <div className="text-xs" style={{ color: "#555" }}>মাস / রশিদ নং</div>
                    <div className="font-bold">{formatMonth(bill.month)}</div>
                    <div className="text-xs">#{bill.id}</div>
                </div>
            </div>

            {/* ── Bill rows: thin lines only, no fills ── */}
            <div style={{ border: "1px solid #000" }}>
                {/* Column header */}
                <div
                    className="flex justify-between font-bold text-sm"
                    style={{ borderBottom: "1px solid #000", padding: "4px 10px" }}
                >
                    <span>বিবরণ</span>
                    <span>টাকা</span>
                </div>

                {/* Line items */}
                {rows.map((row, i) => (
                    <div
                        key={i}
                        className="flex justify-between text-sm"
                        style={{ borderBottom: "1px solid #ddd", padding: "4px 10px" }}
                    >
                        <span>{row.label}</span>
                        <span>৳{(row.val || 0).toLocaleString()}</span>
                    </div>
                ))}

                {/* Paid amount */}
                {bill.amount_paid > 0 && (
                    <div
                        className="flex justify-between text-sm"
                        style={{ borderBottom: "1px solid #bbb", padding: "4px 10px", borderTop: "1px dashed #999" }}
                    >
                        <span>জমা</span>
                        <span>৳{(bill.amount_paid || 0).toLocaleString()}</span>
                    </div>
                )}



                {/* Total — double top border, bold, no fill */}
                <div
                    className="flex justify-between font-black"
                    style={{
                        borderTop: "3px double #000",
                        padding: "6px 10px",
                        fontSize: compact ? "1rem" : "1.1rem",
                    }}
                >
                    <span>সর্বমোট পাওনা</span>
                    <span>৳{(bill.total_bill || 0).toLocaleString()}</span>
                </div>
            </div>



            {/* ── Footer ── */}
            <div
                className="text-center text-xs"
                style={{
                    color: "#777",
                    borderTop: "1px dashed #bbb",
                    marginTop: compact ? "6px" : "10px",
                    paddingTop: "4px",
                }}
            >
                ইনভয়েস ইস্যু করার ৭ দিনের মধ্যে ভাড়া পরিশোধ করুন।
            </div>
        </div>
    );
};

export default ReceiptTemplate;
