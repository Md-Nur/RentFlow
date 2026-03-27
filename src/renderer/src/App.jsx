import { HashRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Receipt, History, Settings, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";

// Pages (to be implemented)
import Dashboard from "./pages/Dashboard";
import Renters from "./pages/Renters";
import MonthlyBilling from "./pages/MonthlyBilling";
import HistoryPage from "./pages/History";

const Sidebar = () => {
    const location = useLocation();

    const links = [
        { name: "Dashboard", path: "/", icon: <LayoutDashboard size={20} /> },
        { name: "Renters", path: "/renters", icon: <Users size={20} /> },
        { name: "Monthly Billing", path: "/billing", icon: <Receipt size={20} /> },
        { name: "History", path: "/history", icon: <History size={20} /> },
    ];

    return (
        <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full h-screen no-print">
            <div className="p-6">
                <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">RentFlow</h1>
            </div>
            <nav className="flex-1 px-4 space-y-2">
                {links.map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === link.path
                            ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                    >
                        {link.icon}
                        <span className="font-medium">{link.name}</span>
                    </Link>
                ))}
            </nav>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <button
                    onClick={() => document.documentElement.classList.toggle("dark")}
                    className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <Moon className="hidden dark:block" size={20} />
                    <Sun className="block dark:hidden" size={20} />
                    <span>Toggle Theme</span>
                </button>
            </div>
        </div>
    );
};

function App() {
    return (
        <Router>
            <div className="flex min-h-screen">
                <Sidebar />
                <main className="flex-1 p-8 overflow-auto bg-slate-50 dark:bg-slate-950">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/renters" element={<Renters />} />
                        <Route path="/billing" element={<MonthlyBilling />} />
                        <Route path="/history" element={<HistoryPage />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
