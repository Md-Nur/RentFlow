import { useState, useEffect } from "react";
import { Users, DollarSign, ArrowUpRight, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const Dashboard = () => {
    const [summary, setSummary] = useState({ totalRenters: 0, monthlyIncome: [] });
    const [loading, setLoading] = useState(true);

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
        { name: "Total Renters", value: summary.totalRenters, icon: <Users className="text-blue-600" />, change: "+2 from last month" },
        {
            name: "Income This Month",
            value: `৳${summary.monthlyIncome.length > 0 ? summary.monthlyIncome[summary.monthlyIncome.length - 1].total.toLocaleString() : 0}`,
            icon: <DollarSign className="text-green-600" />,
            change: "+12.5% vs last month"
        },
        { name: "Occupancy Rate", value: "85%", icon: <TrendingUp className="text-purple-600" />, change: "Stable" },
    ];

    if (loading) return <div className="flex items-center justify-center h-full">Loading...</div>;

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold">Welcome back, Admin</h1>
                <p className="text-slate-500 dark:text-slate-400">Here's what's happening with RentFlow today.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">{stat.icon}</div>
                            <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
                                <ArrowUpRight size={12} /> {stat.change}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{stat.name}</p>
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
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: "rgba(99, 102, 241, 0.1)" }}
                                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                                />
                                <Bar dataKey="total" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 italic">
                            No data available for charts. Start by saving some bills!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
