import { useState, useEffect } from "react";
import { Save, AlertCircle, FileCode } from "lucide-react";
import { generateBillingHTML } from '../utils/htmlGenerator';

const MonthlyBilling = () => {
    const [renters, setRenters] = useState([]);
    const [readings, setReadings] = useState({}); // { renterId: currentReading }
    const [prevReadings, setPrevReadings] = useState({}); // { renterId: previousReading }
    const [customElecBills, setCustomElecBills] = useState({}); // { renterId: amount }
    const [prevDues, setPrevDues] = useState({}); // { renterId: amount }
    const [rates, setRates] = useState({}); // { renterId: electricity_rate }
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchRenters = async () => {
            const data = await window.api.getAllRenters();
            setRenters(data);

            // Fetch latest billing history to compute outstanding dues
            let duesMap = {};
            try {
                const latestDues = await window.api.getLatestDues();
                latestDues.forEach(d => {
                    // due is total_bill minus what they have paid
                    const remainingDue = Math.max(0, (d.total_bill || 0) - (d.amount_paid || 0));
                    duesMap[d.renter_id] = remainingDue;
                });
            } catch (err) {
                console.error("Failed to fetch latest dues:", err);
            }

            const initialReadings = {};
            const initialPrevReadings = {};
            const initialCustomElecBills = {};
            const initialDues = {};
            const initialRates = {};
            data.forEach((r) => {
                initialReadings[r.id] = r.previous_reading;
                initialPrevReadings[r.id] = r.previous_reading;
                initialCustomElecBills[r.id] = undefined;
                initialDues[r.id] = duesMap[r.id] || 0;
                initialRates[r.id] = r.electricity_rate || 0;
            });
            setReadings(initialReadings);
            setPrevReadings(initialPrevReadings);
            setPrevDues(initialDues);
            setRates(initialRates);
            setCustomElecBills(initialCustomElecBills);
        };
        fetchRenters();
    }, []);

    const handleReadingChange = (id, value) => {
        setReadings({ ...readings, [id]: parseFloat(value) || 0 });
        setCustomElecBills({ ...customElecBills, [id]: undefined });
    };

    const handlePrevReadingChange = (id, value) => {
        setPrevReadings({ ...prevReadings, [id]: parseFloat(value) || 0 });
        setCustomElecBills({ ...customElecBills, [id]: undefined });
    };

    const handleDueChange = (id, value) => {
        setPrevDues({ ...prevDues, [id]: parseFloat(value) || 0 });
    };

    const handleRateChange = (id, value) => {
        setRates({ ...rates, [id]: parseFloat(value) || 0 });
        setCustomElecBills({ ...customElecBills, [id]: undefined });
    };

    const handleCustomElecBillChange = (id, value) => {
        setCustomElecBills({ ...customElecBills, [id]: value === "" ? undefined : parseFloat(value) || 0 });
    };

    const calculateBill = (renter) => {
        const current = readings[renter.id] || 0;
        const previous = prevReadings[renter.id] !== undefined ? prevReadings[renter.id] : (renter.previous_reading || 0);
        const units = Math.max(0, current - previous);
        const rate = rates[renter.id] || 0;
        
        const electricityBill = customElecBills[renter.id] !== undefined 
            ? customElecBills[renter.id] 
            : units * rate;
            
        const prevDue = prevDues[renter.id] || 0;

        const total =
            (renter.monthly_rent || 0) +
            (renter.toilet_fee || 0) +
            (renter.garbage_bill || 0) +
            (renter.kitchen_bill || 0) +
            (renter.service_charge || 0) +
            electricityBill +
            prevDue;

        return { 
            previous_reading: previous,
            current_reading: current,
            units_used: units, 
            electricity_bill: electricityBill, 
            total_bill: total, 
            rate 
        };
    };


    const handleSaveHTML = async () => {
        if (renters.length === 0) return;
        const calculatedBills = renters.map(r => ({
            ...r,
            ...calculateBill(r),
            month: month,
            id: `TEMP-${r.id}-${month}`
        }));
        const htmlContent = generateBillingHTML(calculatedBills);
        const res = await window.api.saveHTML({
            htmlContent,
            filename: `RentReceipts_${month}.html`
        });
        if (res.success) {
            alert(`HTML receipts exported successfully to:\n${res.filePath}`);
        } else if (res.reason !== "cancelled") {
            alert(`Failed to save HTML file: ${res.error || "Unknown error"}`);
        }
    };

    const handleSave = async () => {
        if (!confirm(`Are you sure you want to save bills for ${month}? This will update previous readings for next month.`)) return;

        setIsSaving(true);
        try {
            const billsToSave = renters.map((renter) => {
                const calc = calculateBill(renter);
                return {
                    renter_id: renter.id,
                    previous_reading: calc.previous_reading,
                    current_reading: calc.current_reading,
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

            const initialReadings = {};
            const initialPrevReadings = {};
            const initialCustomElecBills = {};
            const initialDues = {};
            const initialRates = {};
            
            let duesMap = {};
            try {
                const latestDues = await window.api.getLatestDues();
                latestDues.forEach(d => {
                    const remainingDue = Math.max(0, (d.total_bill || 0) - (d.amount_paid || 0));
                    duesMap[d.renter_id] = remainingDue;
                });
            } catch (err) {
                console.error("Failed to fetch latest dues:", err);
            }

            data.forEach((r) => {
                initialReadings[r.id] = r.previous_reading;
                initialPrevReadings[r.id] = r.previous_reading;
                initialCustomElecBills[r.id] = undefined;
                initialDues[r.id] = duesMap[r.id] || 0;
                initialRates[r.id] = r.electricity_rate || 0;
            });
            setReadings(initialReadings);
            setPrevReadings(initialPrevReadings);
            setPrevDues(initialDues);
            setRates(initialRates);
            setCustomElecBills(initialCustomElecBills);
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
                            onClick={handleSaveHTML}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
                        >
                            <FileCode size={18} />
                            <span>Save as HTML</span>
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
                            <th className="px-3 py-4 font-semibold text-sm w-36">Prev Reading</th>
                            <th className="px-3 py-4 font-semibold text-sm w-36">Curr Reading</th>
                            <th className="px-6 py-4 font-semibold text-sm text-right">Units</th>
                            <th className="px-3 py-4 font-semibold text-sm w-28">Rate</th>
                            <th className="px-3 py-4 font-semibold text-sm w-36">Elec Bill</th>
                            <th className="px-3 py-4 font-semibold text-sm w-36">Prev Due</th>
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
                                    <td className="px-3 py-4">
                                        <input
                                            type="number"
                                            className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-indigo-500"
                                            value={prevReadings[renter.id] || ""}
                                            onChange={(e) => handlePrevReadingChange(renter.id, e.target.value)}
                                        />
                                    </td>
                                    <td className="px-3 py-4">
                                        <input
                                            type="number"
                                            className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-indigo-500"
                                            value={readings[renter.id] || ""}
                                            onChange={(e) => handleReadingChange(renter.id, e.target.value)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-right">{calc.units_used}</td>
                                    <td className="px-3 py-4">
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-indigo-500 text-center"
                                            value={rates[renter.id] || ""}
                                            onChange={(e) => handleRateChange(renter.id, e.target.value)}
                                        />
                                    </td>
                                    <td className="px-3 py-4">
                                        <input
                                            type="number"
                                            className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-indigo-500 font-medium text-right text-indigo-600 dark:text-indigo-400"
                                            value={customElecBills[renter.id] !== undefined ? customElecBills[renter.id] : calc.electricity_bill}
                                            onChange={(e) => handleCustomElecBillChange(renter.id, e.target.value)}
                                            placeholder="Direct Input"
                                        />
                                    </td>
                                    <td className="px-3 py-4">
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
