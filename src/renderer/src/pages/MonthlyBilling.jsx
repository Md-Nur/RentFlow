import { useState, useEffect } from "react";
import { Save, Calculator, AlertCircle, Printer, Download } from "lucide-react";
import ReceiptTemplate from "../components/ReceiptTemplate";
import { generateReceiptPDF_v11 } from '../utils/pdfGenerator';

const MonthlyBilling = () => {
    const [renters, setRenters] = useState([]);
    const [readings, setReadings] = useState({}); // { renterId: currentReading }
    const [prevDues, setPrevDues] = useState({}); // { renterId: amount }
    const [rates, setRates] = useState({}); // { renterId: electricity_rate }
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchRenters = async () => {
            const data = await window.api.getAllRenters();
            setRenters(data);
            const initialReadings = {};
            const initialDues = {};
            const initialRates = {};
            data.forEach((r) => {
                initialReadings[r.id] = r.previous_reading;
                initialDues[r.id] = 0;
                initialRates[r.id] = r.electricity_rate || 0;
            });
            setReadings(initialReadings);
            setPrevDues(initialDues);
            setRates(initialRates);
        };
        fetchRenters();
    }, []);

    const handleReadingChange = (id, value) => {
        setReadings({ ...readings, [id]: parseFloat(value) || 0 });
    };

    const handleDueChange = (id, value) => {
        setPrevDues({ ...prevDues, [id]: parseFloat(value) || 0 });
    };

    const handleRateChange = (id, value) => {
        setRates({ ...rates, [id]: parseFloat(value) || 0 });
    };

    const calculateBill = (renter) => {
        const current = readings[renter.id] || 0;
        const previous = renter.previous_reading || 0;
        const units = Math.max(0, current - previous);
        const rate = rates[renter.id] || 0;
        const electricityBill = units * rate;
        const prevDue = prevDues[renter.id] || 0;

        const total =
            (renter.monthly_rent || 0) +
            (renter.toilet_fee || 0) +
            (renter.garbage_bill || 0) +
            (renter.kitchen_bill || 0) +
            (renter.service_charge || 0) +
            electricityBill +
            prevDue;

        return { units_used: units, electricity_bill: electricityBill, total_bill: total, rate };
    };

    const handleBatchPrint = () => {
        if (renters.length === 0) return;
        window.print();
    };

    const handleSavePDF = async () => {
        if (renters.length === 0) return;
        const calculatedBills = renters.map(r => ({
            ...r,
            ...calculateBill(r),
            month: month,
            id: `TEMP-${r.id}-${month}`
        }));
        await generateReceiptPDF_v11(calculatedBills, `RentReceipts_${month}.pdf`);
    };

    const handleSave = async () => {
        if (!confirm(`Are you sure you want to save bills for ${month}? This will update previous readings for next month.`)) return;

        setIsSaving(true);
        try {
            const billsToSave = renters.map((renter) => {
                const calc = calculateBill(renter);
                return {
                    renter_id: renter.id,
                    previous_reading: renter.previous_reading,
                    current_reading: readings[renter.id],
                    units_used: calc.units_used,
                    electricity_bill: calc.electricity_bill,
                    electricity_rate: calc.rate,
                    monthly_rent: renter.monthly_rent,
                    toilet_fee: renter.toilet_fee,
                    garbage_bill: renter.garbage_bill,
                    kitchen_bill: renter.kitchen_bill,
                    service_charge: renter.service_charge,
                    previous_due: prevDues[renter.id],
                    total_bill: calc.total_bill
                };
            });

            await window.api.saveBills({ bills: billsToSave, month });
            alert("Bills saved successfully!");
            // Refresh list to update previous_reading UI
            const data = await window.api.getAllRenters();
            setRenters(data);
        } catch (error) {
            console.error("Save failed:", error);
            alert("Failed to save bills.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Monthly Billing <span className="text-xs font-normal opacity-30">v11</span></h1>
                    <p className="text-slate-500">Calculate and generate bills for the current month.</p>
                </div>
                <div className="flex items-center gap-4">
                    {renters.length > 0 && (
                        <button
                            onClick={handleBatchPrint}
                            className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            <Printer size={18} />
                            <span>Print All</span>
                        </button>
                    )}
                    {renters.length > 0 && (
                        <button
                            onClick={handleSavePDF}
                            className="bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                        >
                            <Download size={18} />
                            <span>Save as PDF</span>
                        </button>
                    )}
                    <input
                        type="month"
                        className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                    />
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
                    >
                        <Save size={20} /> {isSaving ? "Saving..." : "Save Bills"}
                    </button>
                </div>
            </div>

            <div className="print-only">
                {(() => {
                    const pages = [];
                    const calculatedBills = renters.map(r => ({
                        ...r,
                        ...calculateBill(r),
                        month: month,
                        id: `TEMP-${r.id}-${month}`
                    }));
                    for (let i = 0; i < calculatedBills.length; i += 2) {
                        pages.push(calculatedBills.slice(i, i + 2));
                    }
                    return pages.map((page, pageIndex) => (
                        <div key={pageIndex} className="page-break print-grid">
                            {page.map((bill) => (
                                <ReceiptTemplate key={bill.id} bill={bill} compact={true} />
                            ))}
                        </div>
                    ));
                })()}
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                    Entering a current reading lower than the previous reading will result in 0 units used.
                    Saving bills will automatically set the "Previous Reading" for next month to the "Current Reading" entered here.
                </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <th className="px-6 py-4 font-semibold text-sm">Room</th>
                            <th className="px-6 py-4 font-semibold text-sm">Prev Reading</th>
                            <th className="px-6 py-4 font-semibold text-sm w-28">Curr Reading</th>
                            <th className="px-6 py-4 font-semibold text-sm text-right">Units</th>
                            <th className="px-6 py-4 font-semibold text-sm w-24">Rate</th>
                            <th className="px-6 py-4 font-semibold text-sm text-right">Elec Bill</th>
                            <th className="px-6 py-4 font-semibold text-sm w-28">Prev Due</th>
                            <th className="px-6 py-4 font-semibold text-sm text-right">Total Bill</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {renters.map((renter) => {
                            const calc = calculateBill(renter);
                            return (
                                <tr key={renter.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{renter.name}</div>
                                        <div className="text-xs text-slate-400 font-mono">{renter.room_number}</div>
                                    </td>
                                    <td className="px-6 py-4">{renter.previous_reading}</td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="number"
                                            className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-indigo-500"
                                            value={readings[renter.id] || ""}
                                            onChange={(e) => handleReadingChange(renter.id, e.target.value)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-right">{calc.units_used}</td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-indigo-500 text-center"
                                            value={rates[renter.id] || ""}
                                            onChange={(e) => handleRateChange(renter.id, e.target.value)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-right">৳{calc.electricity_bill.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="number"
                                            className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-indigo-500"
                                            value={prevDues[renter.id] || ""}
                                            onChange={(e) => handleDueChange(renter.id, e.target.value)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                                        ৳{calc.total_bill.toLocaleString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MonthlyBilling;
