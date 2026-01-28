import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { AlertTriangle } from 'lucide-react';

export function RevertModal({ isOpen, onClose, onConfirm, targetLog }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password === 'Admin@123') {
            onConfirm();
            onClose();
            setPassword('');
            setError('');
        } else {
            setError('Incorrect password');
        }
    };

    if (!targetLog) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Revert Changes">
            <div className="space-y-4">
                <div className="flex items-start gap-4 bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-800">
                    <AlertTriangle className="shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-semibold mb-1">Warning: Destructive Action</p>
                        <p>
                            You are about to revert the application state to specific point in time.
                            <strong> All changes made after {new Date(targetLog.timestamp).toLocaleTimeString()} will be permanently lost.</strong>
                        </p>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                    <p className="text-slate-500 mb-1">Reverting to:</p>
                    <p className="font-medium text-slate-900">{targetLog.description}</p>
                    <p className="text-slate-400 text-xs mt-1">By {targetLog.user} • {new Date(targetLog.timestamp).toLocaleString()}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <Input
                        type="password"
                        label="Enter Admin Password"
                        placeholder="Required to revert"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError('');
                        }}
                        autoFocus
                    />
                    {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
                            Confirm Revert
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
