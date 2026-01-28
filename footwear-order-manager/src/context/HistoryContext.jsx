import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { logAction } from '../services/db';

const HistoryContext = createContext();

export function useHistory() {
    return useContext(HistoryContext);
}

const STORAGE_KEY_HISTORY = 'order_manager_history';
const STORAGE_KEY_DEVICE = 'order_manager_device_name';

export function HistoryProvider({ children }) {
    const [history, setHistory] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
        return stored ? JSON.parse(stored) : [];
    });

    const [deviceName, setDeviceName] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY_DEVICE);
        if (stored) return stored;

        // Auto-generate default name if none exists
        const newName = `PC-${Math.floor(Math.random() * 9000) + 1000}`;
        localStorage.setItem(STORAGE_KEY_DEVICE, newName);
        return newName;
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    }, [history]);

    const updateDeviceName = (newName) => {
        setDeviceName(newName);
        localStorage.setItem(STORAGE_KEY_DEVICE, newName);
    };

    /**
     * Adds a new log entry with a snapshot of the current state
     * @param {string} description - Human readable description of action
     * @param {any} snapshot - The full state of the application (orders array)
     */
    const addLog = (description, snapshot) => {
        const newLog = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            user: deviceName,
            description,
            snapshot: JSON.parse(JSON.stringify(snapshot)) // Deep copy to ensure immutability
        };

        setHistory(prev => {
            // Keep only last 50 entries to prevent storage bloat
            const newHistory = [newLog, ...prev].slice(0, 50);
            return newHistory;
        });

        // Search log to Firebase
        logAction("HISTORY_SNAPSHOT", {
            description,
            user: deviceName,
            snapshotId: newLog.id
            // We avoid sending the huge snapshot to 'logs' collection to save cost/size, 
            // unless specifically requested. The 'order_history' collection handles per-order diffs.
            // But for robustness, we can send it or just reliance on local for Undo.
            // The user said "all the edit history ... to firebase db".
        });
    };

    /**
     * Returns the snapshot associated with a specific log ID
     */
    const getSnapshot = (logId) => {
        const log = history.find(l => l.id === logId);
        return log ? log.snapshot : null;
    };

    /**
     * Prunes history after a revert to maintain timeline consistency (optional, strictly requested "revert all change after")
     * In this implementation, we will perform a non-destructive revert (just applying old state), 
     * but usually "reverting" implies creating a NEW log saying "Reverted to X".
     * However, the user asked to "revert all change made after that log".
     * This implies a destructive rollback of the history timeline itself.
     */
    const rollbackHistory = (targetLogId) => {
        setHistory(prev => {
            const index = prev.findIndex(l => l.id === targetLogId);
            if (index === -1) return prev;
            // Keep the target log and everything OLDER than it (indices >= index)
            // Effectively removing everything newer (indices < index)
            return prev.slice(index);
        });
    };

    return (
        <HistoryContext.Provider value={{
            history,
            addLog,
            deviceName,
            updateDeviceName,
            getSnapshot,
            rollbackHistory
        }}>
            {children}
        </HistoryContext.Provider>
    );
}
