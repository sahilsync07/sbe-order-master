import React, { useState, useRef, useEffect } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export function RapidOrderEntry({ onSave, onSearch }) {
    const [rows, setRows] = useState([
        { id: 1, article: '', color: '', size: '', quantity: '' }
    ]);

    // Ref to track the last input for focus management
    const lastInputRef = useRef(null);

    const handleKeyDown = (e, index, field) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // If on the last field of the last row, add a new row
            if (index === rows.length - 1 && field === 'quantity') {
                const newId = rows.length + 1;
                setRows([...rows, { id: newId, article: '', color: '', size: '', quantity: '' }]);
            }
        }
    };

    // Focus the first input of the new row when rows change
    useEffect(() => {
        if (rows.length > 1 && lastInputRef.current) {
            // Find the newly added row's first input
            // This is a simple heuristic, a more robust ID-based focus system could be used but this works for sequential entry
            const inputs = document.querySelectorAll('input[name="article"]');
            if (inputs[rows.length - 1]) {
                inputs[rows.length - 1].focus();
            }
        }
    }, [rows.length]);

    const handleChange = (index, field, value) => {
        const newRows = [...rows];
        newRows[index][field] = value;
        setRows(newRows);

        // If Article changes, trigger search update
        if (field === 'article' && onSearch) {
            onSearch(value);
        }
    };

    const removeRow = (index) => {
        if (rows.length === 1) {
            // Don't remove the last row, just clear it
            setRows([{ id: 1, article: '', color: '', size: '', quantity: '' }]);
            return;
        }
        const newRows = rows.filter((_, i) => i !== index);
        setRows(newRows);
    };

    const handleSave = () => {
        // Filter out empty rows
        const validRows = rows.filter(r => r.article && r.quantity);
        if (validRows.length === 0) return;

        // Sanitize rows before sending up
        const cleanedRows = validRows.map(({ id, ...rest }) => rest);
        onSave(cleanedRows);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Rapid Order Entry</h3>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                    <thead>
                        <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                            <th className="pb-3 w-[30%]">Article</th>
                            <th className="pb-3 w-[25%] pl-4">Color</th>
                            <th className="pb-3 w-[15%] pl-4">Size</th>
                            <th className="pb-3 w-[15%] pl-4">Qty</th>
                            <th className="pb-3 w-[10%]"></th>
                        </tr>
                    </thead>
                    <tbody className="space-y-2">
                        {rows.map((row, index) => (
                            <tr key={row.id} className="group">
                                <td className="py-2">
                                    <input
                                        name="article"
                                        placeholder="Article"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-400"
                                        value={row.article}
                                        onChange={(e) => handleChange(index, 'article', e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, index, 'article')}
                                    />
                                </td>
                                <td className="py-2 pl-4">
                                    <input
                                        placeholder="Color"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-400"
                                        value={row.color}
                                        onChange={(e) => handleChange(index, 'color', e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, index, 'color')}
                                    />
                                </td>
                                <td className="py-2 pl-4">
                                    <input
                                        placeholder="Size"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-400"
                                        value={row.size}
                                        onChange={(e) => handleChange(index, 'size', e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, index, 'size')}
                                    />
                                </td>
                                <td className="py-2 pl-4">
                                    <input
                                        placeholder="Qty"
                                        type="number"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-400"
                                        value={row.quantity}
                                        onChange={(e) => handleChange(index, 'quantity', e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, index, 'quantity')}
                                    />
                                </td>
                                <td className="py-2 pl-4 text-center">
                                    <button
                                        onClick={() => removeRow(index)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        tabIndex={-1}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 flex justify-between items-center border-t border-slate-100 pt-4">
                <button
                    onClick={() => setRows([...rows, { id: rows.length + 1, article: '', color: '', size: '', quantity: '' }])}
                    className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    <Plus size={16} />
                    Add Row
                </button>
                <Button onClick={handleSave} disabled={!rows.some(r => r.article && r.quantity)}>
                    <Save size={18} className="mr-2" />
                    Save Items
                </Button>
            </div>
        </div>
    );
}
