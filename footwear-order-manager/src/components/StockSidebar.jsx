import React, { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { Package, Search, AlertCircle, Loader2, Sparkles, Box } from 'lucide-react';
import { formatDistanceToNow, isValid } from 'date-fns';
import { Badge } from './ui/Badge';
import { extractColor } from '../utils/colors';
import livestockIcon from '../assets/livestock.svg';

const STOCK_DATA_URL = 'https://raw.githubusercontent.com/sahilsync07/sbe/refs/heads/main/frontend/public/assets/stock-data.json';

export function StockSidebar({ searchTerm: externalSearchTerm, onItemSelect }) {
    const [stockData, setStockData] = useState([]);
    const [lastSync, setLastSync] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [localSearch, setLocalSearch] = useState('');

    useEffect(() => {
        const fetchStock = async () => {
            try {
                const response = await fetch(STOCK_DATA_URL);
                if (!response.ok) throw new Error('Failed to fetch stock data');
                const data = await response.json();

                // Extract Meta Data
                const meta = data.find(g => g.groupName === '_META_DATA_');
                if (meta && meta.lastSync) {
                    setLastSync(new Date(meta.lastSync));
                }

                // Flatten the data: Groups -> Products (exclude meta data group)
                const flatList = data
                    .filter(g => g.groupName !== '_META_DATA_')
                    .flatMap(group =>
                        group.products.map(product => ({
                            ...product,
                            groupName: group.groupName
                        }))
                    );

                setStockData(flatList);
            } catch (err) {
                console.error("Stock fetch error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStock();
    }, []);

    // Effect to start searching if external props change
    useEffect(() => {
        if (externalSearchTerm !== undefined) {
            setLocalSearch(externalSearchTerm);
        }
    }, [externalSearchTerm]);

    const fuse = useMemo(() => {
        return new Fuse(stockData, {
            keys: ['productName', 'groupName'],
            threshold: 0.4,
            distance: 100,
        });
    }, [stockData]);

    // Regex Parser for Stock Strings
    const parseStockItem = (rawName) => {
        let name = rawName || '';
        let size = '';
        let colorInfo = null;
        let price = '';
        let priceType = 'Net'; // Default to Net (RS.)

        // 1. Extract Price
        // Matches: RS.90, MRP280, Rs. 330, @400, etc.
        const priceMatch = name.match(/(MRP|RS\.?|@)\s*(\d+(?:\.\d+)?)/i);
        if (priceMatch) {
            const label = priceMatch[1].toUpperCase();
            priceType = label.startsWith('MRP') ? 'MRP' : 'Net';
            price = priceMatch[2];
            // Remove the price part and any trailing /- from the name
            name = name.replace(priceMatch[0], '').replace(/\/-\s*$/, '').trim();
        }

        // 2. Extract Size
        // Matches: (5*10), (7X10), (6-9), 6*9, 6x9 etc with or without parens
        const sizeMatch = name.match(/(\(*\s*\d+[\s\.]*[xX\*]\s*[\d\.]+\s*\)*)|(\(*\s*\d+\s*\-\s*\d+\s*\)*)/);
        if (sizeMatch) {
            // Clean up parens and spaces
            const rawSize = sizeMatch[0];
            size = rawSize.replace(/[\(\)]/g, '').replace(/\s+/g, '');
            name = name.replace(rawSize, '').trim();
        }

        // 3. Extract Color using the enhanced utility
        colorInfo = extractColor(name);
        if (colorInfo) {
            // Remove the found color tokens from the name
            colorInfo.originalTokens.forEach(token => {
                // escape regex special chars in token if any
                const escaped = token.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
                name = name.replace(regex, '').trim();
            });
            // Clean up double spaces or left over slash
            name = name.replace(/\s+\/\s+/g, ' ').replace(/\s+/g, ' ').trim();
        }

        // Final cleanup of name - remove trailing/leading non-alphanumeric if needed
        name = name.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');

        return { name, color: colorInfo, size, price, priceType, originalName: rawName };
    };

    const results = useMemo(() => {
        if (!localSearch || localSearch.length < 2) return [];
        // Perform search on raw list
        const rawResults = fuse.search(localSearch).slice(0, 15).map(result => result.item);

        // Map results to parsed format for display
        return rawResults.map(item => ({
            ...item,
            parsed: parseStockItem(item.productName)
        }));
    }, [localSearch, fuse]);

    return (
        <div className="h-full flex flex-col bg-transparent z-20 overflow-hidden relative">
            {/* Clean, Modern Header data-tauri-drag-region */}
            <div className="p-4 pb-2 shrink-0 z-20">
                <div className="hidden md:flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center shrink-0 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                            <img src={livestockIcon} alt="Stock" className="w-6 h-6 object-contain opacity-90" />
                        </div>
                        <div>
                            <h2 className="text-base md:text-lg font-bold text-white leading-tight tracking-tight">Live Stock</h2>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mt-0.5">
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin text-emerald-400" size={10} />
                                        <span>Syncing...</span>
                                    </>
                                ) : (
                                    <>
                                        <div className={`w-1.5 h-1.5 rounded-full ${lastSync ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-600'}`}></div>
                                        <span>
                                            {lastSync && isValid(lastSync)
                                                ? formatDistanceToNow(lastSync, { addSuffix: true })
                                                : 'Inventory Ready'}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Integrated Search Input - Glassy Pill Style (Desktop Only) */}
                <div className="relative group mb-1 hidden md:block">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={16} />
                    <input
                        type="text"
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        placeholder="Search stock..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all font-medium text-slate-200 placeholder:text-slate-600 shadow-inner"
                    />
                </div>
            </div>

            {/* Subtle Divider Gradient */}
            <div className="h-6 bg-linear-to-b from-[#13131a] to-transparent shrink-0 z-10 pointer-events-none -mt-4"></div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5 scroll-smooth custom-scrollbar">
                {!localSearch && (
                    <div className="hidden md:flex flex-col items-center justify-center h-40 text-center px-6 opacity-60">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3 text-slate-600 border border-white/5">
                            <Search size={20} />
                        </div>
                        <p className="text-slate-500 font-medium text-sm">Type to search inventory...</p>
                    </div>
                )}

                {localSearch && results.length === 0 && !loading && (
                    <div className="text-center py-8 fade-in animate-in slide-in-from-bottom-2">
                        <div className="bg-white/5 text-slate-500 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 border border-white/10">
                            <AlertCircle size={24} />
                        </div>
                        <h3 className="font-bold text-slate-400 text-sm">No match found</h3>
                    </div>
                )}

                {results.map((product, idx) => (
                    <div
                        key={idx}
                        className="group relative bg-[#1c1c24] border border-white/5 rounded-xl p-2.5 hover:border-emerald-500/30 hover:bg-[#25252e] transition-all duration-200 cursor-pointer overflow-hidden active:scale-[0.98]"
                        onClick={() => onItemSelect && onItemSelect(product)}
                    >
                        <div className="flex gap-3 relative z-10">
                            {/* Image Thumbnail */}
                            <div className="w-12 h-12 rounded-lg bg-white/5 shrink-0 border border-white/5 overflow-hidden relative group-hover:scale-105 transition-transform duration-300">
                                {product.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.parsed.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100" loading="lazy" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                                        <Box size={16} />
                                    </div>
                                )}
                            </div>

                            {/* Parsed Details */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className="flex justify-between items-start gap-2">
                                    <h4 className="font-bold text-slate-200 text-xs leading-tight truncate pr-2 group-hover:text-emerald-400 transition-colors">
                                        {product.parsed.name}
                                    </h4>
                                    {product.parsed.price && (
                                        <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0 h-4 font-mono font-medium bg-white/5 border-white/10 text-slate-400">
                                            {product.parsed.priceType === 'MRP' ? 'MRP' : '₹'} {product.parsed.price}
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                    {product.parsed.color && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                            <div
                                                className="w-1.5 h-1.5 rounded-full border border-white/10"
                                                style={{ backgroundColor: product.parsed.color.hex }}
                                            ></div>
                                            {product.parsed.color.text}
                                        </span>
                                    )}
                                    {product.parsed.size && (
                                        <span className="text-[10px] font-mono font-medium text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                            {product.parsed.size}
                                        </span>
                                    )}
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ml-auto tracking-wide ${product.quantity > 0
                                        ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                                        : 'text-red-400 bg-red-500/10 border border-red-500/20'
                                        }`}>
                                        {product.quantity > 0 ? `${product.quantity} PRS` : 'OUT'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div >
        </div >
    );
}
