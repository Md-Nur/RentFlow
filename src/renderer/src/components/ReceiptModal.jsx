import { Printer, Download, X } from "lucide-react";
import ReceiptTemplate from "./ReceiptTemplate";
import { generateReceiptPDF_v10 } from '../utils/pdfGenerator';

const ReceiptModal = ({ bill, onClose }) => {
    const exportPDF = async () => {
        await generateReceiptPDF_v10(bill, `Receipt_${bill.name}_${bill.month}.pdf`);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between no-print">
                    <h2 className="text-xl font-bold">ভাড়ার রশিদ</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={exportPDF}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                            title="Download PDF"
                        >
                            <Download size={20} />
                        </button>
                        <button
                            onClick={handlePrint}
                            className="p-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Print"
                        >
                            <Printer size={20} />
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 ml-2">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 bg-white printable-receipt">
                    <style>{`
            @media print {
              .no-print { display: none !important; }
              body { background: white !important; }
              .printable-receipt { padding: 0 !important; width: 100% !important; height: auto !important; }
            }
          `}</style>

                    <ReceiptTemplate bill={bill} />
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;
