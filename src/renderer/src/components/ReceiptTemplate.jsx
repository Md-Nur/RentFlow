import React from "react";

const ReceiptTemplate = ({ bill, compact = false }) => {
    // Utility to format month if it's in YYYY-MM format
    const formatMonth = (m) => {
        if (!m) return "";
        const [year, month] = m.split("-");
        const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
        return `${months[parseInt(month) - 1]} ${year}`;
    };

    return (
        <div className={`bg-white text-slate-900 printable-receipt ${compact ? "p-6 border-b border-dashed border-slate-300 last:border-0" : "p-12"}`}>
            <div className={`text-center ${compact ? "mb-4" : "mb-10"}`}>
                <h1 className={`${compact ? "text-2xl" : "text-4xl"} font-black text-indigo-600 tracking-tight uppercase`}>RentFlow</h1>
                <p className="text-slate-500 uppercase tracking-widest text-sm mt-1 font-bold">মাসিক ভাড়ার রশিদ</p>
            </div>

            <div className={`flex justify-between items-start ${compact ? "mb-4" : "mb-8"}`}>
                <div>
                    <p className="text-sm text-slate-400 uppercase font-bold">ভাড়াটিয়া</p>
                    <h3 className={`${compact ? "text-xl" : "text-2xl"} font-bold`}>{bill.name}</h3>
                    <p className="text-slate-600">রুম নং: {bill.room_number}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-slate-400 uppercase font-bold">মাস</p>
                    <h3 className={`${compact ? "text-lg" : "text-xl"} font-bold`}>{formatMonth(bill.month)}</h3>
                    <p className="text-slate-600 italic">রশিদ নং: #{bill.id}</p>
                </div>
            </div>

            <div className={`border border-slate-200 rounded-2xl overflow-hidden ${compact ? "mb-4" : "mb-8"}`}>
                <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-2">
                    <span className="font-bold text-slate-700">বিবরণ</span>
                    <span className="font-bold text-slate-700 text-right">টাকা</span>
                </div>
                <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 text-sm">
                        <span className="text-slate-600">বিদ্যুৎ বিল ({bill.previous_reading || 0} - {bill.current_reading || 0}) = {bill.units_used || 0} ইউনিট</span>
                        <span className="text-right font-medium text-lg">৳{(bill.electricity_bill || 0).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 text-sm">
                        <span className="text-slate-600">মাসিক ভাড়া</span>
                        <span className="text-right font-medium text-lg">৳{(bill.monthly_rent || 0).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 text-sm">
                        <span className="text-slate-600">টয়লেট খরচ</span>
                        <span className="text-right font-medium text-lg">৳{(bill.toilet_fee || 0).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 text-sm">
                        <span className="text-slate-600">ময়লা বিল</span>
                        <span className="text-right font-medium text-lg">৳{(bill.garbage_bill || 0).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 text-sm">
                        <span className="text-slate-600">রান্নাঘর বিল</span>
                        <span className="text-right font-medium text-lg">৳{(bill.kitchen_bill || 0).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 text-sm">
                        <span className="text-slate-600">সার্ভিস চার্জ</span>
                        <span className="text-right font-medium text-lg">৳{(bill.service_charge || 0).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 text-sm border-t border-slate-100 pt-3">
                        <span className="text-slate-400">বকেয়া (গত মাসের)</span>
                        <span className="text-right font-medium text-slate-400">৳{(bill.previous_due || 0).toLocaleString()}</span>
                    </div>
                </div>
                <div className="bg-indigo-600 p-6 grid grid-cols-2 text-white">
                    <span className="text-lg font-bold">সর্বমোট পাওনা</span>
                    <span className="text-2xl font-black text-right">৳{(bill.total_bill || 0).toLocaleString()}</span>
                </div>
            </div>

            <div className={`text-center text-xs text-slate-400 italic border-t border-slate-100 ${compact ? "mt-4 pt-2" : "mt-8 pt-4"}`}>
                ইনভয়েস ইস্যু করার ৭ দিনের মধ্যে ভাড়া পরিশোধ করুন। এই রশিদটি আপনার রেকর্ডের জন্য সংগ্রহে রাখুন।
            </div>
        </div>
    );
};

export default ReceiptTemplate;
