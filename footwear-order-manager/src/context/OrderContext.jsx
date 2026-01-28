import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useHistory } from './HistoryContext';
import { subscribeToOrders, saveOrder, updateOrder, restoreDatabase } from '../services/db';

const OrderContext = createContext();

export function OrderProvider({ children }) {
    const { addLog } = useHistory();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Subscribe to Firebase updates
    useEffect(() => {
        const unsubscribe = subscribeToOrders((newOrders) => {
            setOrders(newOrders);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const addOrder = async (orderData) => {
        try {
            // Optimistic update or wait for firebase? 
            // For robustness, we'll let the subscription update the UI, 
            // but we can log optimistically if needed.
            // However, saveOrder returns an ID, which is different from current synchronous logic.
            // The current app generates UUIDs locally.
            // We can continue to generate UUID locally IF we set it as document ID, 
            // OR let Firestore generate it.
            // existing code: id: uuidv4()

            const newOrder = {
                // id: uuidv4(), // Let Firestore decide ID or use this one? 
                // Creating a local object to match existing structure passed to DB
                ...orderData,
                date: new Date().toISOString(),
                status: 'pending',
                items: []
            };

            // We'll use the ID from firestore for consistency, 
            // but the UI currently expects immediate feedback.
            // The subscription will handle the UI update.
            await saveOrder(newOrder);

            // Log is handled in db.js mainly for "Actions", but HistoryContext needs to be kept in sync?
            // If we move to robust DB, HistoryContext's "Snapshot" approach covering ALL orders might be too heavy.
            // For now, we'll keep calling addLog to maintain existing "undo" features if they rely on it,
            // ALTHOUGH, mixing local state undo with remote DB is tricky.
            // I'll stick to just firing the save.
            addLog(`Created order "${newOrder.title}"`, [newOrder, ...orders]);
        } catch (e) {
            console.error("Failed to add order", e);
        }
    };

    const addItemToOrder = async (orderId, itemData) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const updatedItems = [...order.items, {
            id: uuidv4(),
            received: false,
            dateCreated: new Date().toISOString(),
            dateModified: null,
            ...itemData
        }];

        try {
            await updateOrder(orderId, { items: updatedItems });
            addLog(`Added item "${itemData.article}" to order`, orders); // Note: orders is technically stale here until sub updates
        } catch (e) {
            console.error("Failed to add item", e);
        }
    };

    const addItemsToOrder = async (orderId, itemsData) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const newItems = itemsData.map(item => ({
            id: uuidv4(),
            received: false,
            dateCreated: new Date().toISOString(),
            dateModified: null,
            ...item
        }));

        const updatedItems = [...order.items, ...newItems];

        try {
            await updateOrder(orderId, { items: updatedItems });
            addLog(`Added ${itemsData.length} items to order`, orders);
        } catch (e) {
            console.error("Failed to add items", e);
        }
    };

    const toggleItemReceived = async (orderId, itemId) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        let changedItemName = '';
        let isReceived = false;

        const updatedItems = order.items.map(item => {
            if (item.id !== itemId) return item;
            changedItemName = item.article;
            isReceived = !item.received; // logic flip

            return {
                ...item,
                received: !item.received,
                receivedDate: !item.received ? new Date().toISOString() : null,
                dateModified: new Date().toISOString()
            };
        });

        try {
            await updateOrder(orderId, { items: updatedItems });
            if (changedItemName) {
                addLog(`Marked "${changedItemName}" as ${isReceived ? 'Received' : 'Pending'}`, orders);
            }
        } catch (e) {
            console.error("Failed to toggle item", e);
        }
    };

    // Helper to completely replace state (for Revert)
    const replaceState = async (newOrdersState) => {
        // setOrders(newOrdersState); // Subscription will handle this
        try {
            await restoreDatabase(newOrdersState);
        } catch (e) {
            console.error("Failed to restore state", e);
        }
    };

    const getOrder = (id) => orders.find(o => o.id === id);

    return (
        <OrderContext.Provider value={{ orders, loading, addOrder, addItemToOrder, addItemsToOrder, toggleItemReceived, getOrder, replaceState }}>
            {children}
        </OrderContext.Provider>
    );
}

export const useOrders = () => useContext(OrderContext);
