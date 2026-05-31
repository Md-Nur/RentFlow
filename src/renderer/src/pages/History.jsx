import { useState, useEffect } from "react";
import { Search, Printer, FileText, Download, Coins } from "lucide-react";
import ReceiptModal from "../components/ReceiptModal";
import ReceiptTemplate from "../components/ReceiptTemplate";
import RecordPaymentModal from "../components/RecordPaymentModal";
import { generateReceiptPDF_v11 } from '../utils/pdfGenerator';

const History = () => {
    const [history, setHistory] = useState([]);
    const [month, setMonth] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBill, setSelectedBill] = useState(null);
    const [paymentBill, setPaymentBill] = useState(null);

    const fetchHistory = async () => {
        const data = await window.api.getBillingHistory(month || null);
        setHistory(data);
    };

    useEffect(() => {
        fetchHistory();
    }, [month]);

    const filteredHistory = history.filter(
        (h) =>
            h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.room_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleBatchPrint = () => {
        if (filteredHistory.length === 0) return;
        window.print();
    };

    const handleSavePDF = async () => {
        if (filteredHistory.length === 0) return;
        await generateReceiptPDF_v11(filteredHistory, `RentReceipts_${month || "All"}.pdf`);
    };

    return (
        <div className="space-y-6">
            <div className="print-only">
                {(() => {
                    const pages = [];
                    for (let i = 0; i < filteredHistory.length; i += 2) {
                        pages.push(filteredHistory.slice(i, i + 2));
                    }
                    return pages.map((page, pageIndex) => (
                        <div key={pageIndex} className={`page-break print-grid`}>
                            {page.map((bill) => (
                                <ReceiptTemplate key={bill.id} bill={bill} compact={true} />
                            ))}
                        </div>
                    ));
                })()}
            </div>

            <div className="flex items-center justify-between no-print">
                <div>
                    <h1 className="text-3xl font-bold">Billing History</h1>
                    <p className="text-slate-500">View and print past monthly receipts.</p>
                </div>
                <div className="flex items-center gap-4">
                    {month && filteredHistory.length > 0 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleBatchPrint}
                                className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
                            >
                                <Printer size={18} />
                                <span>Print All</span>
                            </button>
                            <button
                                onClick={handleSavePDF}
                                className="bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-900/20 shadow-sm"
                            >
                                <Download size={18} />
                                <span>Save as PDF</span>
                            </button>
                        </div>
                    )}
                    <input
                        type="month"
                        className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 no-print">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or room..."
                        className="w-full bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-2 rounded-lg border-none focus:ring-2 focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden no-print">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <th className="px-6 py-4 font-semibold text-sm">Month</th>
                            <th className="px-6 py-4 font-semibold text-sm">Room</th>
                            <th className="px-6 py-4 font-semibold text-sm">Name</th>
                            <th className="px-6 py-4 font-semibold text-sm text-right">Total Bill</th>
                            <th className="px-6 py-4 font-semibold text-sm text-right">Amount Paid</th>
                            <th className="px-6 py-4 font-semibold text-sm text-center">Payment Status</th>
                            <th className="px-6 py-4 font-semibold text-sm text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredHistory.map((bill) => {
                            const isPaid = (bill.amount_paid || 0) >= (bill.total_bill || 0);
                            const isPartial = (bill.amount_paid || 0) > 0 && (bill.amount_paid || 0) < (bill.total_bill || 0);
                            const remaining = Math.max(0, (bill.total_bill || 0) - (bill.amount_paid || 0));

                            return (
                                <tr key={bill.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="px-6 py-4 font-medium">{bill.month}</td>
                                    <td className="px-6 py-4">{bill.room_number}</td>
                                    <td className="px-6 py-4 font-medium">{bill.name}</td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-300">
                                        ৳{(bill.total_bill || 0).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                        ৳{(bill.amount_paid || 0).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {isPaid ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                                                Paid
                                            </span>
                                        ) : isPartial ? (
                                            <span 
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30"
                                                title={`Due: ৳${remaining.toLocaleString()}`}
                                            >
                                                Partial (Due: ৳{remaining.toLocaleString()})
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                                                Unpaid
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setPaymentBill(bill)}
                                                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                                                    isPaid 
                                                        ? "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700" 
                                                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/10"
                                                }`}
                                                title="Record or update payment"
                                            >
                                                <Coins size={14} />
                                                <span>{isPaid ? "Paid Details" : "Record Pay"}</span>
                                            </button>
                                            <button
                                                onClick={() => setSelectedBill(bill)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                                                title="View Receipt"
                                            >
                                                <FileText size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {selectedBill && (
                <ReceiptModal bill={selectedBill} onClose={() => setSelectedBill(null)} />
            )}

            {paymentBill && (
                <RecordPaymentModal 
                    bill={paymentBill} 
                    onClose={() => setPaymentBill(null)} 
                    onSave={() => {
                        setPaymentBill(null);
                        fetchHistory();
                    }} 
                />
            )}
        </div>
    );
};

export default History;
