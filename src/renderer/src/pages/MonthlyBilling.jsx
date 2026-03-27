import { useState, useEffect } from "react";
import { Save, Calculator, AlertCircle } from "lucide-react";

const MonthlyBilling = () => {
    const [renters, setRenters] = useState([]);
    const [readings, setReadings] = useState({}); // { renterId: currentReading }
    const [prevDues, setPrevDues] = useState({}); // { renterId: amount }
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchRenters = async () => {
            const data = await window.api.getAllRenters();
            setRenters(data);
            const initialReadings = {};
            const initialDues = {};
            data.forEach((r) => {
                initialReadings[r.id] = r.previous_reading;
                initialDues[r.id] = 0;
            });
            setReadings(initialReadings);
            setPrevDues(initialDues);
        };
        fetchRenters();
    }, []);

    const handleReadingChange = (id, value) => {
        setReadings({ ...readings, [id]: parseFloat(value) || 0 });
    };

    const handleDueChange = (id, value) => {
        setPrevDues({ ...prevDues, [id]: parseFloat(value) || 0 });
    };

    const calculateBill = (renter) => {
        const current = readings[renter.id] || 0;
        const previous = renter.previous_reading || 0;
        const units = Math.max(0, current - previous);
        const electricityBill = units * (renter.electricity_rate || 0);
        const prevDue = prevDues[renter.id] || 0;

        const total =
            (renter.monthly_rent || 0) +
            (renter.toilet_fee || 0) +
            (renter.garbage_bill || 0) +
            (renter.kitchen_bill || 0) +
            (renter.service_charge || 0) +
            electricityBill +
            prevDue;

        return { units, electricityBill, total };
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
                    units_used: calc.units,
                    electricity_bill: calc.electricityBill,
                    monthly_rent: renter.monthly_rent,
                    toilet_fee: renter.toilet_fee,
                    garbage_bill: renter.garbage_bill,
                    kitchen_bill: renter.kitchen_bill,
                    service_charge: renter.service_charge,
                    previous_due: prevDues[renter.id],
                    total_bill: calc.total
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
                    <h1 className="text-3xl font-bold">Monthly Billing</h1>
                    <p className="text-slate-500">Calculate and generate bills for the current month.</p>
                </div>
                <div className="flex items-center gap-4">
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
                            <th className="px-6 py-4 font-semibold text-sm">Prev Reading</th>
                            <th className="px-6 py-4 font-semibold text-sm w-32">Curr Reading</th>
                            <th className="px-6 py-4 font-semibold text-sm text-right">Units</th>
                            <th className="px-6 py-4 font-semibold text-sm text-right">Elec Bill</th>
                            <th className="px-6 py-4 font-semibold text-sm w-32">Prev Due</th>
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
                                    <td className="px-6 py-4 text-right">{calc.units}</td>
                                    <td className="px-6 py-4 text-right">৳{calc.electricityBill.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="number"
                                            className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-indigo-500"
                                            value={prevDues[renter.id] || ""}
                                            onChange={(e) => handleDueChange(renter.id, e.target.value)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                                        ৳{calc.total.toLocaleString()}
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
