import { useState, useEffect } from "react";
import { X, Calendar, DollarSign, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

const RecordPaymentModal = ({ bill, onClose, onSave }) => {
    const [amountPaid, setAmountPaid] = useState(bill.amount_paid || 0);
    const [paymentDate, setPaymentDate] = useState(
        bill.payment_date || new Date().toISOString().slice(0, 10)
    );
    const [isSaving, setIsSaving] = useState(false);

    const totalBill = bill.total_bill || 0;
    const remainingDue = Math.max(0, totalBill - amountPaid);

    const handlePaidInFull = () => {
        setAmountPaid(totalBill);
    };

    const handleClear = () => {
        setAmountPaid(0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            let isPaid = 0; // Unpaid
            if (amountPaid >= totalBill) {
                isPaid = 1; // Paid
            } else if (amountPaid > 0) {
                isPaid = 2; // Partially Paid
            }

            await window.api.updatePaymentStatus({
                billId: bill.id,
                amountPaid: parseFloat(amountPaid) || 0,
                isPaid,
                paymentDate: amountPaid > 0 ? paymentDate : null
            });

            onSave();
        } catch (error) {
            console.error("Failed to record payment:", error);
            alert("Failed to save payment status.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Record Rent Payment</h2>
                        <p className="text-sm text-slate-500 mt-1">Room {bill.room_number} • {bill.name}</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Bill Info Card */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl flex justify-between items-center border border-slate-100 dark:border-slate-800">
                        <div>
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Month</span>
                            <p className="text-slate-700 dark:text-slate-300 font-semibold">{bill.month}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Bill</span>
                            <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">৳{totalBill.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Amount Paid Input */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Amount Paid (৳)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-bold">৳</span>
                            <input
                                type="number"
                                required
                                min="0"
                                max={totalBill}
                                step="any"
                                className="w-full bg-slate-50 dark:bg-slate-800/80 pl-9 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-semibold text-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all focus:outline-none"
                                value={amountPaid === 0 ? "" : amountPaid}
                                onChange={(e) => setAmountPaid(Math.min(totalBill, Math.max(0, parseFloat(e.target.value) || 0)))}
                                placeholder="0.00"
                            />
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-2 pt-1">
                            <button
                                type="button"
                                onClick={handlePaidInFull}
                                className="flex-1 py-2 px-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                            >
                                <CheckCircle2 size={14} />
                                Paid In Full
                            </button>
                            <button
                                type="button"
                                onClick={handleClear}
                                className="py-2 px-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* Payment Date */}
                    {amountPaid > 0 && (
                        <div className="space-y-2 animate-fade-in">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Payment Date
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="date"
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-800/80 pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all focus:outline-none"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Payment Live Summary */}
                    <div className="bg-slate-50 dark:bg-slate-800/20 rounded-2xl p-4 space-y-2.5 border border-slate-100 dark:border-slate-800/60">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Total Bill Amount</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">৳{totalBill.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Amount Received</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">+ ৳{amountPaid.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Carried Due (to next month)</span>
                            <span className={`text-lg font-black ${remainingDue > 0 ? "text-amber-500 dark:text-amber-400" : "text-slate-400 dark:text-slate-600"}`}>
                                ৳{remainingDue.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all flex items-center justify-center gap-2"
                        >
                            {isSaving ? "Saving..." : "Save Payment"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecordPaymentModal;
