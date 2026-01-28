import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useHistory } from './HistoryContext';

const OrderContext = createContext();

export function OrderProvider({ children }) {
    const { addLog } = useHistory();

    // Initialize with some dummy data if empty
    const [orders, setOrders] = useState(() => {
        const saved = localStorage.getItem('orders');
        try {
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse orders", e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('orders', JSON.stringify(orders));
    }, [orders]);

    const addOrder = (orderData) => {
        const newOrder = {
            id: uuidv4(),
            date: new Date().toISOString(),
            status: 'pending',
            items: [],
            ...orderData
        };

        // Calculate new state based on CURRENT orders state
        // This avoids putting side effects in the setOrders updater
        const newState = [newOrder, ...orders];
        setOrders(newState);
        addLog(`Created order "${newOrder.title}"`, newState);
    };

    const addItemToOrder = (orderId, itemData) => {
        const newState = orders.map(order => {
            if (order.id !== orderId) return order;
            return {
                ...order,
                items: [...order.items, {
                    id: uuidv4(),
                    received: false,
                    dateCreated: new Date().toISOString(),
                    dateModified: null,
                    ...itemData
                }]
            };
        });

        setOrders(newState);
        addLog(`Added item "${itemData.article}" to order`, newState);
    };

    const addItemsToOrder = (orderId, itemsData) => {
        const newState = orders.map(order => {
            if (order.id !== orderId) return order;
            const newItems = itemsData.map(item => ({
                id: uuidv4(),
                received: false,
                dateCreated: new Date().toISOString(),
                dateModified: null,
                ...item
            }));
            return {
                ...order,
                items: [...order.items, ...newItems]
            };
        });

        setOrders(newState);
        addLog(`Added ${itemsData.length} items to order`, newState);
    };

    const toggleItemReceived = (orderId, itemId) => {
        let changedItemName = '';
        let isReceived = false;

        const newState = orders.map(order => {
            if (order.id !== orderId) return order;

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

            return { ...order, items: updatedItems };
        });

        setOrders(newState);

        if (changedItemName) {
            addLog(`Marked "${changedItemName}" as ${isReceived ? 'Received' : 'Pending'}`, newState);
        }
    };

    // Helper to completely replace state (for Revert)
    const replaceState = (newOrdersState) => {
        setOrders(newOrdersState);
    };

    const getOrder = (id) => orders.find(o => o.id === id);

    return (
        <OrderContext.Provider value={{ orders, addOrder, addItemToOrder, addItemsToOrder, toggleItemReceived, getOrder, replaceState }}>
            {children}
        </OrderContext.Provider>
    );
}

export const useOrders = () => useContext(OrderContext);
