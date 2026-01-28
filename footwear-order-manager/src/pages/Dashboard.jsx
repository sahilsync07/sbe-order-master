import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, MoreHorizontal, ArrowRight, Package, History, RotateCcw, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { useHistory } from '../context/HistoryContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { RevertModal } from '../components/RevertModal';

export default function Dashboard() {
    const navigate = useNavigate();
    const { orders, addOrder, replaceState } = useOrders();
    const { history, rollbackHistory, deviceName, updateDeviceName } = useHistory();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [revertTarget, setRevertTarget] = useState(null);
    const [activeStatus, setActiveStatus] = useState('pending'); // Default to Pending as requested

    const [newOrderSupplier, setNewOrderSupplier] = useState('');
    const [newOrderDate, setNewOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [isEditingDeviceName, setIsEditingDeviceName] = useState(false);
    const [tempDeviceName, setTempDeviceName] = useState(deviceName);

    const handleCreateOrder = (e) => {
        e.preventDefault();
        if (!newOrderSupplier) return;

        // Auto-generate title
        const formattedDate = new Date(newOrderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const title = `${newOrderSupplier} Order ${formattedDate}`;

        addOrder({
            title: title,
            supplier: newOrderSupplier,
            date: newOrderDate
        });
        setIsCreateModalOpen(false);
        setNewOrderSupplier('');
        setNewOrderDate(new Date().toISOString().split('T')[0]);
    };

    const handleRevert = () => {
        // ... (existing revert logic)
        if (!revertTarget) return;

        replaceState(revertTarget.snapshot);
        rollbackHistory(revertTarget.id);

        setRevertTarget(null);
        setIsHistoryOpen(false);
    };

    const getOrderStatus = (order) => {
        if (!order.items || order.items.length === 0) return 'pending';
        const receivedCount = order.items.filter(i => i.received).length;
        if (receivedCount === order.items.length) return 'completed';
        if (receivedCount > 0) return 'in progress';
        return 'pending';
    };

    // Filter Logic
    const filteredOrders = orders.filter(order => {
        if (activeStatus === 'all') return true;
        return getOrderStatus(order) === activeStatus;
    });


    const getStatusVariant = (status) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'completed': return 'success';
            case 'in progress': return 'info';
            default: return 'default';
        }
    };

    return (
        <div className="h-full bg-slate-50 md:rounded-tl-[40px] overflow-hidden flex flex-col relative shadow-2xl shadow-black/20 z-0">
            <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-32 scroll-smooth custom-scrollbar">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header Actions */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight">Active Orders</h2>
                            <p className="text-slate-500 mt-1">Manage and track your supplier distributions</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsHistoryOpen(true)}
                                className="bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
                            >
                                <History size={18} className="mr-2" />
                                History
                            </Button>
                            <Button onClick={() => setIsCreateModalOpen(true)} className="shadow-lg shadow-indigo-500/20">
                                <Plus size={18} className="mr-2" />
                                Create New Order
                            </Button>
                        </div>
                    </div>

                    {/* Stats/Filters Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {['All', 'Pending', 'In Progress', 'Completed'].map((tab, i) => {
                            const statusKey = tab.toLowerCase();
                            const isActive = activeStatus === statusKey;

                            let realCount = 0;
                            if (statusKey === 'all') {
                                realCount = orders.length;
                            } else {
                                realCount = orders.filter(o => getOrderStatus(o) === statusKey).length;
                            }

                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveStatus(statusKey)}
                                    className={`px-4 py-3 rounded-xl font-medium text-sm transition-all text-left flex items-center justify-between ${isActive ? 'bg-white shadow-sm border border-slate-200 text-slate-900 ring-1 ring-slate-100' : 'text-slate-500 hover:bg-white hover:shadow-xs'}`}
                                >
                                    {tab}
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-slate-100 text-slate-900' : 'bg-slate-100 text-slate-500'}`}>
                                        {realCount}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Orders Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {filteredOrders.length === 0 && (
                                <div className="col-span-full py-12 text-center text-slate-400">
                                    <p>No orders found in {activeStatus === 'all' ? 'total' : activeStatus}</p>
                                </div>
                            )}

                            {filteredOrders.map((order, index) => {
                                const currentStatus = getOrderStatus(order);

                                return (
                                    <motion.div
                                        key={order.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => navigate(`/order/${order.id}`)}
                                        className="group bg-[#CBFB45] rounded-[32px] border-none p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
                                    >
                                        {/* Hover Arrow */}
                                        <div className="absolute bottom-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <div className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100">
                                                <ArrowRight size={20} />
                                            </div>
                                        </div>

                                        <div className="flex items-start justify-between mb-6">
                                            <div className="w-12 h-12 rounded-xl bg-white/40 backdrop-blur-sm text-slate-900 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                <Package size={24} />
                                            </div>
                                            <div className="bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full">
                                                <span className="text-xs font-bold text-slate-900 tracking-wider">
                                                    {currentStatus.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-slate-900 transition-colors">{order.title}</h3>
                                        <p className="text-sm text-slate-500 mb-4">{order.supplier}</p>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500">Total Items</span>
                                                <span className="font-semibold text-slate-900">{order.items.length}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500">Received</span>
                                                <span className="font-semibold text-slate-900">
                                                    {order.items.filter(i => i.received).length} / {order.items.length}
                                                </span>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="h-1.5 w-full bg-white/30 rounded-full overflow-hidden mt-4">
                                                <div
                                                    className="h-full bg-slate-900 rounded-full transition-all duration-500"
                                                    style={{ width: `${order.items.length ? (order.items.filter(i => i.received).length / order.items.length) * 100 : 0}%` }}
                                                />
                                            </div>

                                            <div className="pt-4 mt-4 border-t border-slate-50 text-xs text-slate-400 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                                Created {new Date(order.date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Create New Placeholder Card */}
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 p-6 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all duration-300 min-h-[300px]"
                        >
                            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center">
                                <Plus size={32} />
                            </div>
                            <span className="font-medium">Create New Order</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Version History Sidebar */}
            <AnimatePresence>
                {isHistoryOpen && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                            onClick={() => setIsHistoryOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
                        >
                            {/* ... Content of History remains same, no style change needed for inside usually ... */}
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Version History</h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                        <span>User:</span>
                                        {isEditingDeviceName ? (
                                            <input
                                                value={tempDeviceName}
                                                onChange={(e) => setTempDeviceName(e.target.value)}
                                                onBlur={() => {
                                                    updateDeviceName(tempDeviceName);
                                                    setIsEditingDeviceName(false);
                                                }}
                                                onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                                                autoFocus
                                                className="border-b border-indigo-300 outline-none text-indigo-600 px-1 w-32"
                                            />
                                        ) : (
                                            <span
                                                onClick={() => {
                                                    setTempDeviceName(deviceName);
                                                    setIsEditingDeviceName(true);
                                                }}
                                                className="text-indigo-600 font-medium cursor-pointer hover:underline decoration-dashed"
                                            >
                                                {deviceName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setIsHistoryOpen(false)}>
                                    <span className="sr-only">Close</span>
                                    ✕
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {history.length === 0 && (
                                    <div className="text-center text-slate-400 py-10">
                                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No changes logged yet</p>
                                    </div>
                                )}

                                {history.map((log, i) => (
                                    <div key={log.id} className="relative pl-6 pb-6 last:pb-0">
                                        <div className="absolute left-[3px] top-2 bottom-0 w-0.5 bg-slate-100" />
                                        <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-slate-300 ring-4 ring-white" />
                                        <div className="group">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="font-medium text-slate-900 text-sm">{log.description}</p>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                        <span>•</span>
                                                        <span>{log.user}</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-7 text-xs px-2"
                                                    onClick={() => setRevertTarget(log)}
                                                >
                                                    <RotateCcw size={12} className="mr-1.5" />
                                                    Revert
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Order"
            >
                <form onSubmit={handleCreateOrder} className="space-y-4">
                    <Input
                        autoFocus
                        label="Supplier Name"
                        placeholder="e.g. Cubix Footcare"
                        value={newOrderSupplier}
                        onChange={(e) => setNewOrderSupplier(e.target.value)}
                    />
                    <Input
                        type="date"
                        label="Order Date"
                        value={newOrderDate}
                        onChange={(e) => setNewOrderDate(e.target.value)}
                    />
                    <div className="pt-4 flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={!newOrderSupplier}>Create Order</Button>
                    </div>
                </form>
            </Modal>

            <RevertModal
                isOpen={!!revertTarget}
                onClose={() => setRevertTarget(null)}
                targetLog={revertTarget}
                onConfirm={handleRevert}
            />
        </div>
    );
}
