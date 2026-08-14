// Offline Queue Service
// Stores pending operations locally and syncs when online

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const QUEUE_KEY = 'offline_queue';
const MAX_QUEUE_SIZE = 100;

export interface QueuedOperation {
  id: string;
  type: 'create_expense' | 'update_expense' | 'delete_expense' | 'scan_receipt' | 'create_customer' | 'update_customer' | 'create_invoice' | 'update_invoice';
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

let isOnline = true;
let syncInProgress = false;
let listeners: Set<() => void> = new Set();

// Initialize network state listener
export function initNetworkListener(): void {
  NetInfo.addEventListener(state => {
    const wasOnline = isOnline;
    isOnline = state.isConnected ?? false;
    
    if (!wasOnline && isOnline && !syncInProgress) {
      // Came back online - trigger sync
      syncQueue();
    }
    
    notifyListeners();
  });
}

function notifyListeners(): void {
  listeners.forEach(cb => cb());
}

export function addNetworkListener(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getNetworkStatus(): boolean {
  return isOnline;
}

async function getQueue(): Promise<QueuedOperation[]> {
  try {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: QueuedOperation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save offline queue:', e);
  }
}

export async function enqueueOperation(
  type: QueuedOperation['type'],
  payload: any,
  options: { maxRetries?: number } = {}
): Promise<string> {
  const queue = await getQueue();
  
  // Prevent queue from growing too large
  if (queue.length >= MAX_QUEUE_SIZE) {
    // Remove oldest non-retrying items
    const nonRetrying = queue.filter(op => op.retryCount === 0);
    if (nonRetrying.length > 0) {
      const oldest = nonRetrying.reduce((a, b) => a.timestamp < b.timestamp ? a : b);
      const index = queue.indexOf(oldest);
      if (index > -1) queue.splice(index, 1);
    }
  }
  
  const operation: QueuedOperation = {
    id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    payload,
    timestamp: Date.now(),
    retryCount: 0,
    maxRetries: options.maxRetries ?? 5,
  };
  
  queue.push(operation);
  await saveQueue(queue);
  
  // Try immediate sync if online
  if (isOnline && !syncInProgress) {
    syncQueue();
  }
  
  return operation.id;
}

export async function getQueueStatus(): Promise<{ pending: number; failed: number; isOnline: boolean }> {
  const queue = await getQueue();
  const failed = queue.filter(op => op.retryCount >= op.maxRetries).length;
  return {
    pending: queue.length,
    failed,
    isOnline,
  };
}

export async function clearFailedOperations(): Promise<void> {
  const queue = await getQueue();
  const filtered = queue.filter(op => op.retryCount < op.maxRetries);
  await saveQueue(filtered);
}

async function executeOperation(op: QueuedOperation): Promise<boolean> {
  try {
    // Import apiFetch dynamically to avoid circular dependency
    const { apiFetch } = await import('./client');
    
    switch (op.type) {
      case 'create_expense':
        await apiFetch('/expenses', { method: 'POST', body: JSON.stringify(op.payload) });
        break;
      case 'update_expense':
        await apiFetch(`/expenses/${op.payload.id}`, { method: 'PATCH', body: JSON.stringify(op.payload) });
        break;
      case 'delete_expense':
        await apiFetch(`/expenses/${op.payload.id}`, { method: 'DELETE' });
        break;
      case 'create_customer':
        await apiFetch('/customers', { method: 'POST', body: JSON.stringify(op.payload) });
        break;
      case 'update_customer':
        await apiFetch(`/customers/${op.payload.id}`, { method: 'PATCH', body: JSON.stringify(op.payload) });
        break;
      case 'create_invoice':
        await apiFetch('/invoices', { method: 'POST', body: JSON.stringify(op.payload) });
        break;
      case 'update_invoice':
        await apiFetch(`/invoices/${op.payload.id}`, { method: 'PATCH', body: JSON.stringify(op.payload) });
        break;
      default:
        console.warn('Unknown operation type:', op.type);
        return false;
    }
    return true;
  } catch (error) {
    console.error(`Failed to execute operation ${op.id}:`, error);
    return false;
  }
}

export async function syncQueue(): Promise<{ synced: number; failed: number }> {
  if (!isOnline || syncInProgress) {
    return { synced: 0, failed: 0 };
  }
  
  syncInProgress = true;
  notifyListeners();
  
  let synced = 0;
  let failed = 0;
  
  try {
    const queue = await getQueue();
    const pendingOps = queue.filter(op => op.retryCount < op.maxRetries);
    
    for (const op of pendingOps) {
      const success = await executeOperation(op);
      
      if (success) {
        // Remove from queue
        const updatedQueue = queue.filter(q => q.id !== op.id);
        await saveQueue(updatedQueue);
        synced++;
      } else {
        // Increment retry count
        op.retryCount++;
        failed++;
      }
    }
    
    // Save updated retry counts
    await saveQueue(queue);
  } finally {
    syncInProgress = false;
    notifyListeners();
  }
  
  return { synced, failed };
}

export async function forceSync(): Promise<{ synced: number; failed: number }> {
  return syncQueue();
}

export function isSyncing(): boolean {
  return syncInProgress;
}

// Helper to add expense with offline support
export async function createExpenseOffline(expenseData: any): Promise<string> {
  return enqueueOperation('create_expense', expenseData);
}

// Helper to update expense with offline support
export async function updateExpenseOffline(id: string, expenseData: any): Promise<string> {
  return enqueueOperation('update_expense', { id, ...expenseData });
}

// Helper to delete expense with offline support
export async function deleteExpenseOffline(id: string): Promise<string> {
  return enqueueOperation('delete_expense', { id });
}