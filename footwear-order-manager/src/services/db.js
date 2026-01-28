import { db } from "../lib/firebase";
import { collection, addDoc, updateDoc, doc, getDocs, Timestamp, runTransaction, query, orderBy, onSnapshot, writeBatch, deleteDoc } from "firebase/firestore";

// Collection Names
const ORDERS_COLLECTION = "orders";
const LOGS_COLLECTION = "logs";
const HISTORY_COLLECTION = "order_history";

/**
 * Subscribes to orders collection for real-time updates.
 * @param {function} callback - Function to call with new orders data.
 * @returns {function} Unsubscribe function.
 */
export const subscribeToOrders = (callback) => {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(orders);
    }, (error) => {
        console.error("Error subscribing to orders: ", error);
    });
};

/**
 * Saves a new order to Firestore.
 * @param {Object} orderData - The order object.
 * @returns {Promise<string>} The ID of the created order.
 */
export const saveOrder = async (orderData) => {
    try {
        const dataToSave = {
            ...orderData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            status: orderData.status || 'pending'
        };

        const docRef = await addDoc(collection(db, ORDERS_COLLECTION), dataToSave);
        await logAction("CREATE_ORDER", { orderId: docRef.id, summary: `Order created for ${orderData.partyName || 'Unknown Party'}` });
        return docRef.id;
    } catch (error) {
        console.error("Error saving order: ", error);
        throw error;
    }
};

/**
 * Updates an existing order and records history.
 * @param {string} orderId - The document ID of the order.
 * @param {Object} updates - Key-value pairs to update.
 */
export const updateOrder = async (orderId, updates) => {
    try {
        await runTransaction(db, async (transaction) => {
            const orderRef = doc(db, ORDERS_COLLECTION, orderId);
            const orderDoc = await transaction.get(orderRef);

            if (!orderDoc.exists()) {
                throw "Document does not exist!";
            }

            const currentData = orderDoc.data();

            // Create history entry
            const historyRef = doc(collection(db, HISTORY_COLLECTION));
            transaction.set(historyRef, {
                orderId,
                previousData: currentData,
                changes: updates,
                changedAt: Timestamp.now(),
                // user: userId // TODO: Add user ID when auth is implemented
            });

            // Update order
            transaction.update(orderRef, {
                ...updates,
                updatedAt: Timestamp.now()
            });
        });

        await logAction("UPDATE_ORDER", { orderId, changes: Object.keys(updates) });
    } catch (error) {
        console.error("Error updating order: ", error);
        throw error;
    }
};

/**
 * Logs an action for audit purposes.
 * @param {string} action - The action name.
 * @param {Object} details - Additional details.
 */
export const logAction = async (action, details) => {
    try {
        await addDoc(collection(db, LOGS_COLLECTION), {
            action,
            details,
            timestamp: Timestamp.now()
        });
    } catch (error) {
        console.error("Error logging action: ", error);
        // Silent fail for logs to not disrupt main flow
    }
};

/**
 * Fetches all orders.
 * @returns {Promise<Array>} List of orders.
 */
export const getOrders = async () => {
    try {
        const q = query(collection(db, ORDERS_COLLECTION), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting orders: ", error);
        throw error;
    }
}

/**
 * Restores the database to a specific state (snapshot).
 * This performs a synchronization: deleting extra records, adding missing ones, and updating existing ones.
 * @param {Array} ordersSnapshot - The array of orders to restore.
 */
export const restoreDatabase = async (ordersSnapshot) => {
    try {
        const currentOrders = await getOrders();
        const currentIds = new Set(currentOrders.map(o => o.id));
        const snapshotIds = new Set(ordersSnapshot.map(o => o.id));

        const batch = writeBatch(db);
        let opCount = 0;

        // Items to delete (In DB but not in Snapshot)
        currentOrders.forEach(o => {
            if (!snapshotIds.has(o.id)) {
                const ref = doc(db, ORDERS_COLLECTION, o.id);
                batch.delete(ref);
                opCount++;
            }
        });

        // Items to add (In Snapshot but not in DB)
        ordersSnapshot.forEach(o => {
            if (!currentIds.has(o.id)) {
                // Ensure we use the SAME ID from the snapshot
                const ref = doc(db, ORDERS_COLLECTION, o.id);
                const data = { ...o, updatedAt: Timestamp.now() }; // Update timestamp to show it was restored? Or keep original?
                // keeping original data mostly but maybe refresh 'updatedAt'
                batch.set(ref, data);
                opCount++;
            } else {
                // Items to update (In Both)
                // We blindly update to match snapshot
                const ref = doc(db, ORDERS_COLLECTION, o.id);
                batch.set(ref, { ...o, updatedAt: Timestamp.now() }, { merge: true });
                opCount++;
            }
        });

        if (opCount > 0) {
            await batch.commit();
            await logAction("RESTORE_DATABASE", { snapshotSize: ordersSnapshot.length });
        }
    } catch (error) {
        console.error("Error restoring database: ", error);
        throw error;
    }
};
