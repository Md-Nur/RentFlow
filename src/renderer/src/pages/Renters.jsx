import { useState, useEffect } from "react";
import { Plus, Search, MoreVertical, Edit, Trash2 } from "lucide-react";

const Renters = () => {
    const [renters, setRenters] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRenter, setEditingRenter] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        room_number: "",
        monthly_rent: 0,
        electricity_rate: 0,
        previous_reading: 0,
        toilet_fee: 0,
        garbage_bill: 0,
        kitchen_bill: 0,
        service_charge: 0,
    });

    const fetchRenters = async () => {
        const data = await window.api.getAllRenters();
        setRenters(data);
    };

    useEffect(() => {
        fetchRenters();
    }, []);

    const handleOpenModal = (renter = null) => {
        if (renter) {
            setEditingRenter(renter);
            setFormData(renter);
        } else {
            setEditingRenter(null);
            setFormData({
                name: "",
                room_number: "",
                monthly_rent: 0,
                electricity_rate: 0,
                previous_reading: 0,
                toilet_fee: 0,
                garbage_bill: 0,
                kitchen_bill: 0,
                service_charge: 0,
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingRenter) {
            await window.api.updateRenter(formData);
        } else {
            await window.api.addRenter(formData);
        }
        fetchRenters();
        handleCloseModal();
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this renter?")) {
            await window.api.deleteRenter(id);
            fetchRenters();
        }
    };

    const filteredRenters = renters.filter(
        (r) =>
            r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.room_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Renters</h1>
                    <p className="text-slate-500">Manage your property's residents.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
                >
                    <Plus size={20} /> Add Renter
                </button>
            </div>

            {/* Filter and Search */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or room..."
                        className="w-full bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-2 rounded-lg border-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Renters Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <th className="px-6 py-4 font-semibold text-sm">Room</th>
                            <th className="px-6 py-4 font-semibold text-sm">Name</th>
                            <th className="px-6 py-4 font-semibold text-sm text-right">Rent</th>
                            <th className="px-6 py-4 font-semibold text-sm text-right">Prev Reading</th>
                            <th className="px-6 py-4 font-semibold text-sm text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredRenters.map((renter) => (
                            <tr key={renter.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                <td className="px-6 py-4">
                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded font-mono text-sm">
                                        {renter.room_number}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-medium">{renter.name}</td>
                                <td className="px-6 py-4 text-right">৳{renter.monthly_rent}</td>
                                <td className="px-6 py-4 text-right">{renter.previous_reading}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => handleOpenModal(renter)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(renter.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold">{editingRenter ? "Edit Renter" : "Add New Renter"}</h2>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Room Number</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.room_number}
                                        onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Monthly Rent (৳)</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.monthly_rent}
                                        onChange={(e) => setFormData({ ...formData, monthly_rent: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Electricity Rate (per unit)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.electricity_rate}
                                        onChange={(e) => setFormData({ ...formData, electricity_rate: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Previous Meter Reading</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.previous_reading}
                                        onChange={(e) => setFormData({ ...formData, previous_reading: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Toilet Fee</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.toilet_fee}
                                        onChange={(e) => setFormData({ ...formData, toilet_fee: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Garbage</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.garbage_bill}
                                        onChange={(e) => setFormData({ ...formData, garbage_bill: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Kitchen</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.kitchen_bill}
                                        onChange={(e) => setFormData({ ...formData, kitchen_bill: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Service Charge</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.service_charge}
                                        onChange={(e) => setFormData({ ...formData, service_charge: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
                                >
                                    {editingRenter ? "Update" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Renters;
