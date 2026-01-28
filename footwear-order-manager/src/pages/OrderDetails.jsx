import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Check, Clock, Share2, Edit2, Save, Search, X, Box, RotateCcw } from 'lucide-react';
import { useOrders } from '../context/OrderContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { RapidOrderEntry } from '../components/RapidOrderEntry';
import html2pdf from 'html2pdf.js';
import { format, isValid } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

import { StockSidebar } from '../components/StockSidebar';

export default function OrderDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getOrder, addItemToOrder, addItemsToOrder, toggleItemReceived } = useOrders();

    const [isAddingItem, setIsAddingItem] = useState(false);
    // const [newItemData, setNewItemData] = useState({ article: '', color: '', size: '', quantity: '', imageUrl: '' }); // OLD
    const [previewImage, setPreviewImage] = useState(null);
    const [isModifyMode, setIsModifyMode] = useState(false);
    const [orderSearch, setOrderSearch] = useState('');
    const [rapidEntrySearchTerm, setRapidEntrySearchTerm] = useState('');
    const [selectedStockItem, setSelectedStockItem] = useState(null);

    const order = getOrder(id);

    const sortedItems = useMemo(() => {
        if (!order) return [];
        let items = [...order.items];

        if (orderSearch) {
            const lowerSearch = orderSearch.toLowerCase();
            items = items.filter(item =>
                item.article.toLowerCase().includes(lowerSearch) ||
                item.color?.toLowerCase().includes(lowerSearch) ||
                item.size?.toString().includes(lowerSearch)
            );
        }

        return items.sort((a, b) => a.article.toLowerCase().localeCompare(b.article.toLowerCase()));
    }, [order, orderSearch]);

    if (!order) {
        return <div className="p-8 text-center">Order not found</div>;
    }





    const handleStockSelect = (product) => {
        setIsAddingItem(true);
        setSelectedStockItem(product);
    };

    const handleRapidSave = async (newItems) => {
        await addItemsToOrder(id, newItems);
        setIsAddingItem(false);
    };

    // Removed handleSaveNewItem as it is replaced by handleRapidSave

    const generatePDFAndShare = () => {
        const undispatchedItems = order.items.filter(item => !item.received);

        if (undispatchedItems.length === 0) {
            alert("All items have been received! Nothing to send.");
            return;
        }

        const totalCartons = undispatchedItems.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
        const dateStr = format(new Date(), 'dd MMM yyyy');

        // Naming Convention: Title + Timestamp (for uniqueness to avoid 'Download Again' popup)
        const cleanTitle = order.title.replace(/[^a-z0-9\s\-_]/gi, '').trim() || 'Order_Request';
        const timestamp = format(new Date(), 'HHmmss');
        const finalFileName = `${cleanTitle}_${timestamp}.pdf`;

        const element = document.createElement('div');
        element.style.backgroundColor = '#ffffff';
        element.style.color = '#1e293b';

        // NOTE: We inline styles heavily to ensure html2canvas captures them correctly.
        element.innerHTML = `
        <div style="padding: 40px; font-family: sans-serif; color: #1e293b; background-color: #ffffff;">
            <div style="border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h1 style="font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; color: #0f172a;">M/S Sri Brundabana Enterprises</h1>
                    <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">Order Request</p>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 0; font-weight: 600;">Date: ${dateStr}</p>
                    <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">Total Items: ${undispatchedItems.length}</p>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; background-color: #ffffff;">
                <thead>
                    <tr style="background-color: #f8fafc; text-align: left;">
                        <th style="padding: 12px 16px; font-weight: 700; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; width: 40px;">S/N</th>
                        <th style="padding: 12px 16px; font-weight: 700; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; width: 60px;">Image</th>
                        <th style="padding: 12px 16px; font-weight: 700; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0;">Article</th>
                        <th style="padding: 12px 16px; font-weight: 700; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0;">Color</th>
                        <th style="padding: 12px 16px; font-weight: 700; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0;">Size</th>
                        <th style="padding: 12px 16px; font-weight: 700; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; text-align: right;">Qty (Cartons)</th>
                    </tr>
                </thead>
                <tbody>
                    ${undispatchedItems.map((item, index) => `
                        <tr style="border-bottom: 1px solid #f1f5f9; background-color: #ffffff;">
                            <td style="padding: 16px; font-weight: 600; color: #64748b; font-size: 11px;">${index + 1}</td>
                            <td style="padding: 12px 16px; vertical-align: middle;">
                                ${item.imageUrl
                ? `<img src="${item.imageUrl}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; display: block;" crossOrigin="anonymous" />`
                : `<div style="width: 48px; height: 48px; background-color: #f1f5f9; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #cbd5e1; border: 1px solid #e2e8f0;">Img</div>`
            }
                            </td>
                            <td style="padding: 16px; font-weight: 600; color: #0f172a; vertical-align: middle;">${item.article}</td>
                            <td style="padding: 16px; color: #334155; font-style: italic; vertical-align: middle;">${item.color || '-'}</td>
                            <td style="padding: 16px; font-family: monospace; font-weight: 600; color: #334155; vertical-align: middle;">${item.size || '-'}</td>
                            <td style="padding: 16px; font-weight: 700; color: #0f172a; text-align: right; vertical-align: middle;">${item.quantity}</td>
                        </tr>
                    `).join('')}
                    <tr style="background-color: #f8fafc;">
                        <td colspan="5" style="padding: 16px; font-weight: 700; text-align: right; color: #475569;">Total Cartons</td>
                        <td style="padding: 16px; font-weight: 800; color: #0f172a; font-size: 18px; text-align: right;">${totalCartons}</td>
                    </tr>
                </tbody>
            </table>

            <div style="border-top: 2px solid #0f172a; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
                <p>Generated via OrderMaster</p>
            </div>
        </div>
        `;

        const opt = {
            margin: 0,
            filename: finalFileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                backgroundColor: '#ffffff',
                allowTaint: true,
                useCORS: true,
                logging: false
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const style = document.createElement('style');
        style.innerHTML = `html, body { background-color: #ffffff !important; color: #000000 !important; } *, *::before, *::after { border-color: #e2e8f0 !important; }`;
        document.head.appendChild(style);

        const worker = html2pdf().set(opt).from(element);

        worker.output('blob').then((blob) => {
            const file = new File([blob], finalFileName, { type: 'application/pdf' });

            // Canva-like Web Share Strategy
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({
                    files: [file],
                    title: cleanTitle,
                    text: '' // Clean share, no extra text
                }).catch((error) => {
                    console.log('Share failed or cancelled:', error);
                    // Mitigation: If share fails (user cancels or format not supported), ensure they still get the file.
                    // However, avoiding double actions if they just cancelled.
                    if (error.name !== 'AbortError') {
                        worker.save();
                    }
                });
            } else {
                // Fallback for Desktop or unsupported browsers
                console.log("Web Share API not supported for files. Falling back to specific actions.");
                worker.save().then(() => {
                    // Direct WhatsApp Web fallback for Desktop
                    const whatsappUrl = `https://api.whatsapp.com/send?text=`;
                    window.open(whatsappUrl, '_blank');
                });
            }
        })
            .catch(err => {
                console.error("PDF Generation Error:", err);
                alert("Failed to generate PDF. Please try again.");
            })
            .finally(() => {
                if (document.head.contains(style)) document.head.removeChild(style);
            });
    };

    const formatCustomDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (!isValid(date)) return '-';

        // Format: "9pm 27/12/26"
        const timePart = format(date, 'h a').toLowerCase();
        const datePart = format(date, 'dd/MM/yy');
        return `${timePart} ${datePart}`;
    };

    const formatCreatedDate = (dateString) => {
        return formatCustomDate(dateString);
    };

    // Calculate total quantity
    const totalQty = order?.items?.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0) || 0;

    const renderHeader = (dark = false) => (
        <>
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className={`p-1.5 rounded-full transition-colors ${dark ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-200 text-slate-700'}`}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className={`text-sm md:text-2xl font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{order.title}</h1>
                    <div className={`flex items-center gap-1.5 text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span>{order.supplier}</span>
                        <span>•</span>
                        <span>{format(new Date(order.date), 'dd/MM/yy')}</span>
                    </div>
                </div>
            </div>

            {(order.items.length === 0 || isAddingItem) ? (
                <div className="animate-fade-in relative z-10 mt-2 md:mt-0">
                    <RapidOrderEntry
                        onSave={handleRapidSave}
                        onSearch={setRapidEntrySearchTerm}
                        onCancel={order.items.length > 0 ? () => setIsAddingItem(false) : undefined}
                        externalItemToAdd={selectedStockItem}
                        onItemAdded={() => setSelectedStockItem(null)}
                    />
                </div>
            ) : (
                <div className={`flex flex-col md:flex-row gap-2 md:gap-4 justify-between backdrop-blur-md p-2 md:p-4 rounded-xl md:rounded-2xl border shadow-sm transition-all duration-300 mt-2 md:mt-0 ${dark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-white/50'}`}>
                    <div className="flex items-center gap-2 md:gap-4 flex-1 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                        <div className="flex items-center gap-1 md:gap-2 shrink-0 scale-90 md:scale-100 origin-left">
                            <Badge variant="info">Total: {order.items.length}</Badge>
                            <Badge variant="warning">Pending: {order.items.filter(i => !i.received).length}</Badge>
                            <Badge variant="success">Received: {order.items.filter(i => i.received).length}</Badge>
                        </div>
                        {/* Order Search - Visible on Desktop */}
                        <div className="relative max-w-sm w-full hidden md:block group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                            <input
                                placeholder="Filter items..."
                                value={orderSearch}
                                onChange={(e) => setOrderSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white/80 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all shadow-sm"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        {isModifyMode ? (
                            <>
                                <Button onClick={() => setIsAddingItem(true)} variant="secondary" size="sm" className="gap-1 md:gap-2 flex-1 md:flex-none justify-center text-xs md:text-sm h-8 md:h-10">
                                    <Plus size={14} />
                                    Add
                                </Button>
                                <Button onClick={() => setIsModifyMode(false)} variant="primary" size="sm" className="gap-1 md:gap-2 bg-emerald-600 hover:bg-emerald-700 flex-1 md:flex-none justify-center text-xs md:text-sm h-8 md:h-10">
                                    <Save size={14} />
                                    Done
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button onClick={() => setIsModifyMode(true)} variant="secondary" size="sm" className="gap-1 md:gap-2 flex-1 md:flex-none justify-center text-xs md:text-sm h-8 md:h-10">
                                    <Edit2 size={14} />
                                    Modify
                                </Button>
                                <Button onClick={generatePDFAndShare} variant="primary" size="sm" className="gap-1 md:gap-2 flex-1 md:flex-none justify-center text-xs md:text-sm h-8 md:h-10">
                                    <Share2 size={14} />
                                    Share
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );

    const activeDataEntry = (isAddingItem) || (orderSearch?.length > 0) || (rapidEntrySearchTerm?.length > 0);

    return (
        <div className="flex flex-col md:flex-row h-full overflow-hidden bg-[#13131a]">
            {/* Mobile Header - Visible only on mobile, Order 1 */}
            <div className="md:hidden shrink-0 z-10 p-2 pt-1 mb-2">
                {renderHeader(true)}
            </div>

            {/* Left Sidebar: Mobile (Order 2), Desktop (Order 1) */}
            <div className={`w-full md:w-[25%] shrink-0 relative bg-transparent z-0 order-2 md:order-1 border-b md:border-b-0 border-white/5 rounded-t-[24px] md:rounded-t-none md:rounded-tl-[40px] overflow-hidden shadow-sm md:shadow-none mx-0 md:mx-0 transition-all duration-300 ease-in-out ${activeDataEntry ? 'h-[25vh] opacity-100 mb-2' : 'h-0 opacity-0'} md:h-full md:opacity-100 md:mb-0`}>
                <StockSidebar
                    searchTerm={(isAddingItem || order?.items?.length === 0) ? rapidEntrySearchTerm : orderSearch}
                    onItemSelect={handleStockSelect}
                />
            </div>


            {/* Main Content Area: Mobile (Order 3), Desktop (Order 2) */}
            <div className="flex-1 h-full overflow-hidden relative bg-slate-50 md:rounded-l-[40px] shadow-none md:shadow-[-8px_0_24px_rgba(0,0,0,0.06)] z-10 border-l-0 md:border-l border-white/50 flex flex-col order-3 md:order-2">
                {/* Desktop Header - Visible only on desktop */}
                <div className="hidden md:block w-full p-6 pb-0 space-y-6 shrink-0 z-20 bg-slate-50 md:rounded-tl-[40px]">
                    {renderHeader()}
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-auto w-full relative">
                    {(order.items.length > 0 || isAddingItem) ? (
                        <div className="px-4 md:px-6 pb-32">
                            {/* Desktop Table View */}
                            <div className="hidden md:block bg-transparent">
                                <div className="overflow-visible">
                                    <table className="w-full text-left text-sm relative border-separate min-w-[800px] md:min-w-0" style={{ borderSpacing: '0 8px' }}>
                                        <thead className="text-slate-500 sticky top-0 z-30">
                                            <tr className="">
                                                {/* Header BG with rounded corners logic */}
                                                <th className="px-3 md:px-6 py-4 font-bold uppercase tracking-wider text-xs first:rounded-l-2xl bg-white/95 backdrop-blur-sm drop-shadow-sm w-16">
                                                    Img
                                                </th>
                                                <th className="px-3 md:px-6 py-4 font-bold uppercase tracking-wider text-xs bg-white/95 backdrop-blur-sm drop-shadow-sm w-24">Created</th>
                                                <th className="px-3 md:px-6 py-4 font-bold uppercase tracking-wider text-xs bg-white/95 backdrop-blur-sm drop-shadow-sm">Article</th>
                                                <th className="px-3 md:px-6 py-4 font-bold uppercase tracking-wider text-xs bg-white/95 backdrop-blur-sm drop-shadow-sm">Color</th>
                                                <th className="px-3 md:px-6 py-4 font-bold uppercase tracking-wider text-xs bg-white/95 backdrop-blur-sm drop-shadow-sm">Size</th>
                                                <th className="px-3 md:px-6 py-4 font-bold uppercase tracking-wider text-xs bg-white/95 backdrop-blur-sm drop-shadow-sm w-24">Qty</th>
                                                <th className="px-3 md:px-6 py-4 font-bold uppercase tracking-wider text-xs text-right bg-white/95 backdrop-blur-sm drop-shadow-sm shadow-r-none last:rounded-r-2xl">Status</th>
                                                {isModifyMode && (
                                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right last:rounded-r-2xl bg-white/95 backdrop-blur-sm drop-shadow-sm">Action</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <AnimatePresence initial={false}>
                                                {sortedItems.map((item) => {
                                                    // Removed INPUT_ROW rendering block
                                                    if (item.isInputRow) return null;

                                                    return (
                                                        <motion.tr
                                                            layout
                                                            key={item.id}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0 }}
                                                            className={`group transition-all duration-200 ${item.received ? 'opacity-60 grayscale' : 'hover:scale-[1.01] hover:drop-shadow-md'}`}
                                                        >
                                                            <td className={`px-6 py-4 text-slate-500 text-xs first:rounded-l-2xl border-y border-l border-transparent ${item.received ? 'bg-slate-50' : 'bg-white group-hover:bg-slate-50 group-hover:border-indigo-100'}`}>
                                                                {item.imageUrl ? (
                                                                    <div
                                                                        className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 cursor-zoom-in hover:ring-2 hover:ring-indigo-200 transition-all"
                                                                        onClick={() => setPreviewImage(item.imageUrl)}
                                                                    >
                                                                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300">
                                                                        <Box size={16} />
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className={`px-6 py-4 text-slate-500 text-xs border-y border-transparent ${item.received ? 'bg-slate-50' : 'bg-white group-hover:bg-slate-50 group-hover:border-indigo-100'}`}>
                                                                {formatCreatedDate(item.dateCreated)}
                                                            </td>
                                                            <td className={`px-6 py-4 font-medium text-slate-900 border-y border-transparent ${item.received ? 'bg-slate-50' : 'bg-white group-hover:bg-slate-50 group-hover:border-indigo-100'}`}>{item.article}</td>
                                                            <td className={`px-6 py-4 text-slate-600 italic border-y border-transparent ${item.received ? 'bg-slate-50' : 'bg-white group-hover:bg-slate-50 group-hover:border-indigo-100'}`}>{item.color}</td>
                                                            <td className={`px-6 py-4 font-mono text-slate-600 border-y border-transparent ${item.received ? 'bg-slate-50' : 'bg-white group-hover:bg-slate-50 group-hover:border-indigo-100'}`}>{item.size}</td>
                                                            <td className={`px-6 py-4 font-bold text-slate-900 border-y border-transparent ${item.received ? 'bg-slate-50' : 'bg-white group-hover:bg-slate-50 group-hover:border-indigo-100'}`}>{item.quantity}</td>
                                                            <td className={`px-6 py-4 text-right border-y border-transparent ${item.received ? 'bg-slate-50' : 'bg-white group-hover:bg-slate-50 group-hover:border-indigo-100'} ${!isModifyMode && 'last:rounded-r-2xl border-r'}`}>
                                                                <Badge variant={item.received ? 'success' : 'warning'}>
                                                                    {item.received ? 'Completed' : 'Pending'}
                                                                </Badge>
                                                            </td>
                                                            {isModifyMode && (
                                                                <td className={`px-6 py-4 text-right last:rounded-r-2xl border-y border-r border-transparent ${item.received ? 'bg-slate-50' : 'bg-white group-hover:bg-slate-50 group-hover:border-indigo-100'}`}>
                                                                    <button
                                                                        onClick={() => toggleItemReceived(order.id, item.id)}
                                                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all shadow-sm ${item.received
                                                                            ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 ring-1 ring-emerald-200'
                                                                            }`}
                                                                    >
                                                                        {item.received ? (
                                                                            <>
                                                                                <Clock size={16} />
                                                                                Undo
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Check size={16} />
                                                                                Receive
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                </td>
                                                            )}
                                                        </motion.tr>
                                                    );
                                                })}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Mobile Grid/Card View (Flux Inspired) */}
                            <div className="md:hidden space-y-3 pb-8">
                                <AnimatePresence initial={false}>
                                    {sortedItems.map((item) => {
                                        if (item.isInputRow) return null;

                                        return (
                                            <motion.div
                                                layout
                                                key={item.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className={`bg-white rounded-[24px] p-3 shadow-sm border border-slate-100 relative overflow-hidden active:scale-[0.98] transition-transform ${item.received ? 'opacity-70 bg-slate-50/50' : ''}`}
                                            >
                                                <div className="grid grid-cols-[4.5rem_1fr] gap-3">
                                                    {/* Image Column - Spans 2 Rows visually */}
                                                    <div className="row-span-2 aspect-square rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 relative">
                                                        {item.imageUrl ? (
                                                            <img
                                                                src={item.imageUrl}
                                                                alt=""
                                                                className={`w-full h-full object-cover ${item.received ? 'grayscale' : ''}`}
                                                                onClick={() => setPreviewImage(item.imageUrl)}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                <Box size={20} />
                                                            </div>
                                                        )}
                                                        {item.received && (
                                                            <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center">
                                                                <Check size={24} className="text-white drop-shadow-md" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Right Column - Row 1 (Date + Status) & Row 2 (Title) */}
                                                    <div className="flex flex-col min-w-0 h-full justify-center gap-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                                                                {formatCreatedDate(item.dateCreated)}
                                                            </span>
                                                            <Badge variant={item.received ? 'success' : 'warning'} className="scale-[0.8] origin-right px-1.5 py-0 h-5">
                                                                {item.received ? 'Done' : 'Pending'}
                                                            </Badge>
                                                        </div>

                                                        <div>
                                                            <h3 className={`font-bold text-sm leading-tight truncate pr-1 ${item.received ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                                                                {item.article}
                                                            </h3>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Bottom Row - Details */}
                                                <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-50">
                                                    {item.color && (
                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 max-w-[40%]">
                                                            <div className="w-1.5 h-1.5 rounded-full shrink-0 border border-slate-200" style={{ backgroundColor: item.colorHex || '#94a3b8' }}></div>
                                                            <span className="text-xs font-medium text-slate-600 truncate">{item.color}</span>
                                                        </div>
                                                    )}
                                                    <div className="px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 text-xs font-mono text-slate-600">
                                                        {item.size}
                                                    </div>

                                                    <div className="ml-auto flex items-center gap-3 pl-2">
                                                        <span className={`text-sm font-bold ${item.received ? 'text-slate-400' : 'text-slate-900'}`}>{item.quantity} Prs</span>

                                                        {isModifyMode && (
                                                            <button
                                                                onClick={() => toggleItemReceived(order.id, item.id)}
                                                                className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${item.received
                                                                    ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                                    : 'bg-emerald-500 text-white shadow-emerald-200 shadow-md hover:bg-emerald-600'
                                                                    }`}
                                                            >
                                                                {item.received ? <RotateCcw size={14} /> : <Check size={14} />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    ) : null}
                </div>
                {/* Footer Bar */}
                <div className="shrink-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-30 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-medium">Total:</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-slate-900">{totalQty}</span>
                            <span className="text-sm font-semibold text-slate-400">Cartons</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Preview Modal */}
            <AnimatePresence>
                {previewImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8"
                        onClick={() => setPreviewImage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-4xl max-h-full bg-white rounded-2xl overflow-hidden shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-10"
                            >
                                <X size={24} />
                            </button>
                            <img src={previewImage} alt="Preview" className="w-full h-full object-contain max-h-[85vh]" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
