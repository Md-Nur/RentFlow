import { useState, useEffect, useRef } from "react";
import {
  Users,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  Database,
  Download,
  Upload,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const Dashboard = () => {
  const [summary, setSummary] = useState({
    totalRenters: 0,
    monthlyIncome: [],
  });
  const [loading, setLoading] = useState(true);
  const [dbLoading, setDbLoading] = useState({ export: false, import: false });
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message: string }
  const fileInputRef = useRef(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleExport = async () => {
    setDbLoading((prev) => ({ ...prev, export: true }));
    try {
      const result = await window.api.exportData();
      if (result.success) {
        showToast(
          "success",
          `Database exported successfully to:\n${result.filePath}`,
        );
      } else {
        showToast("error", result.error || "Export failed.");
      }
    } catch (err) {
      showToast("error", err.message || "An unexpected error occurred.");
    } finally {
      setDbLoading((prev) => ({ ...prev, export: false }));
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      setDbLoading((prev) => ({ ...prev, import: true }));
      try {
        const jsonData = JSON.parse(evt.target.result);
        const result = await window.api.importData(jsonData);
        if (result.success) {
          showToast(
            "success",
            `Import complete! ${result.rentersImported} renters and ${result.billsImported} bills merged.`,
          );
          // Refresh dashboard stats
          const data = await window.api.getSummary();
          setSummary(data);
        } else {
          showToast("error", result.error || "Import failed.");
        }
      } catch (err) {
        showToast(
          "error",
          "Invalid file or import error: " + (err.message || ""),
        );
      } finally {
        setDbLoading((prev) => ({ ...prev, import: false }));
        e.target.value = ""; // reset so same file can be re-selected
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await window.api.getSummary();
        setSummary(data);
      } catch (error) {
        console.error("Failed to fetch summary:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const stats = [
    {
      name: "Total Renters",
      value: summary.totalRenters,
      icon: <Users className="text-blue-600" />,
      change: "+2 from last month",
    },
    {
      name: "Income This Month",
      value: `৳${summary.monthlyIncome.length > 0 ? summary.monthlyIncome[summary.monthlyIncome.length - 1].total.toLocaleString() : 0}`,
      icon: <DollarSign className="text-green-600" />,
      change: "+12.5% vs last month",
    },
    {
      name: "Occupancy Rate",
      value: "85%",
      icon: <TrendingUp className="text-purple-600" />,
      change: "Stable",
    },
  ];

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">Loading...</div>
    );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Welcome back, Admin</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Here's what's happening with মোল্লা নীড় today.
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                {stat.icon}
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
                <ArrowUpRight size={12} /> {stat.change}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {stat.name}
            </p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold mb-6">Income Overview</h2>
        <div className="h-[300px] w-full">
          {summary.monthlyIncome.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.monthlyIncome}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748B", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748B", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(99, 102, 241, 0.1)" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar
                  dataKey="total"
                  fill="#6366F1"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 italic">
              No data available for charts. Start by saving some bills!
            </div>
          )}
        </div>
      </div>

      {/* Database Tools */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
            <Database
              className="text-indigo-600 dark:text-indigo-400"
              size={20}
            />
          </div>
          <div>
            <h2 className="text-lg font-bold">Database Tools &amp; Backups</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Export your data as JSON or import a backup to merge records.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-5">
          <button
            id="btn-export-db"
            onClick={handleExport}
            disabled={dbLoading.export}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm transition-all shadow-sm"
          >
            {dbLoading.export ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download size={16} />
            )}
            Export Database
          </button>

          <button
            id="btn-import-db"
            onClick={handleImportClick}
            disabled={dbLoading.import}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-60 font-semibold text-sm transition-all"
          >
            {dbLoading.import ? (
              <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            Import &amp; Merge
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileSelected}
          />
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl border max-w-sm animate-fade-in ${
            toast.type === "success"
              ? "bg-green-50 dark:bg-green-900/40 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200"
              : "bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle
              size={20}
              className="mt-0.5 shrink-0 text-green-600 dark:text-green-400"
            />
          ) : (
            <XCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
            />
          )}
          <p className="text-sm font-medium whitespace-pre-line">
            {toast.message}
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
