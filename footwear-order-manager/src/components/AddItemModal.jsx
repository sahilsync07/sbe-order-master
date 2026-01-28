import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';
import { Modal } from './ui/Modal';

export function AddItemModal({ isOpen, onClose, onAdd }) {
    const [formData, setFormData] = useState({
        article: '',
        color: '',
        size: '',
        quantity: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.article || !formData.quantity) return;
        onAdd(formData);
        setFormData({ article: '', color: '', size: '', quantity: '' });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Item">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    autoFocus
                    label="Article Name/No."
                    placeholder="e.g. Air Force 1"
                    value={formData.article}
                    onChange={e => setFormData({ ...formData, article: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Color"
                        placeholder="e.g. White"
                        value={formData.color}
                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                    />
                    <Input
                        label="Size"
                        placeholder="e.g. 42"
                        value={formData.size}
                        onChange={e => setFormData({ ...formData, size: e.target.value })}
                    />
                </div>
                <Input
                    type="number"
                    label="Quantity (Cartons/Pairs)"
                    placeholder="e.g. 10"
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                />
                <div className="pt-4 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Add Item</Button>
                </div>
            </form>
        </Modal>
    );
}
