
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { DatabaseState, KeyValuePair, Operation, OperationType, Snapshot } from './types';

class SnapDB {
  private state: DatabaseState = {
    data: {},
    snapshots: [],
    currentSnapshot: null
  };
  
  private operations: Operation[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    // Initialize with some sample data
    this.put('user:1', JSON.stringify({ name: 'John Doe', email: 'john@example.com' }));
    this.put('user:2', JSON.stringify({ name: 'Jane Smith', email: 'jane@example.com' }));
    this.put('product:1', JSON.stringify({ name: 'Laptop', price: 999.99 }));
    this.put('product:2', JSON.stringify({ name: 'Smartphone', price: 499.99 }));
    this.put('settings:theme', 'dark');
    this.put('settings:notifications', 'enabled');
    this.put('counter', '1');
    
    // Create initial snapshot
    this.createSnapshot('Initial state', 'System generated initial snapshot');
  }

  // Core database operations
  public get(key: string): string | null {
    return this.state.data[key]?.value || null;
  }

  public put(key: string, value: string): void {
    this.state.data[key] = {
      key,
      value,
      lastModified: new Date()
    };
    this.recordOperation('put', key, value);
    this.notifyListeners();
  }

  public delete(key: string): boolean {
    if (!(key in this.state.data)) return false;
    
    delete this.state.data[key];
    this.recordOperation('delete', key);
    this.notifyListeners();
    return true;
  }

  public clear(): void {
    this.state.data = {};
    this.recordOperation('clear');
    this.notifyListeners();
  }

  public getAllKeys(): string[] {
    return Object.keys(this.state.data);
  }

  public getAllEntries(): KeyValuePair[] {
    return Object.values(this.state.data);
  }

  // Snapshot functionality
  public createSnapshot(name: string, description?: string): string {
    const id = uuidv4();
    const snapshot: Snapshot = {
      id,
      name,
      timestamp: new Date(),
      // Deep clone the current data
      data: JSON.parse(JSON.stringify(this.state.data)),
      description,
      tags: []
    };
    
    this.state.snapshots.push(snapshot);
    this.recordOperation('snapshot', undefined, undefined, id, description);
    this.notifyListeners();
    
    toast.success(`Snapshot "${name}" created successfully`);
    return id;
  }

  public getSnapshots(): Snapshot[] {
    return [...this.state.snapshots];
  }

  public getSnapshotById(id: string): Snapshot | undefined {
    return this.state.snapshots.find(s => s.id === id);
  }

  public restoreSnapshot(id: string): boolean {
    const snapshot = this.state.snapshots.find(s => s.id === id);
    if (!snapshot) return false;
    
    // Create an automatic snapshot of the current state before restoring
    this.createSnapshot(`Auto-backup before restoring to "${snapshot.name}"`, 
      `System generated backup before restoring to snapshot ${id}`);
    
    // Restore the data from the snapshot
    this.state.data = JSON.parse(JSON.stringify(snapshot.data));
    this.state.currentSnapshot = id;
    
    this.recordOperation('restore', undefined, undefined, id);
    this.notifyListeners();
    
    toast.success(`Restored to snapshot: ${snapshot.name}`);
    return true;
  }

  // Time travel functionality
  public getStateAtSnapshot(id: string): Record<string, KeyValuePair> | null {
    const snapshot = this.state.snapshots.find(s => s.id === id);
    return snapshot ? JSON.parse(JSON.stringify(snapshot.data)) : null;
  }

  // Operation history
  public getOperations(): Operation[] {
    return [...this.operations];
  }

  // Event notification system
  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Internal helper methods
  private recordOperation(
    type: OperationType, 
    key?: string, 
    value?: string, 
    snapshotId?: string,
    description?: string
  ): void {
    const operation: Operation = {
      type,
      timestamp: new Date(),
      key,
      value,
      snapshotId,
      description
    };
    
    this.operations.push(operation);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Demo functionality
  public simulateDataCorruption(): void {
    // Create a snapshot before corruption for later recovery
    this.createSnapshot('Pre-corruption backup', 'Automatic backup before simulated corruption');
    
    // Corrupt some percentage of keys with garbage data
    const keys = this.getAllKeys();
    const corruptionCount = Math.max(1, Math.floor(keys.length * 0.5));
    
    for (let i = 0; i < corruptionCount; i++) {
      const keyToCorrupt = keys[Math.floor(Math.random() * keys.length)];
      this.put(keyToCorrupt, `CORRUPTED_DATA_${Math.random().toString(36).substring(7)}`);
    }
    
    toast.error("Data corruption simulated! Use snapshots to recover.", {
      duration: 5000
    });
  }

  // Add a key incrementally
  public incrementCounter(): void {
    const currentValue = this.get('counter');
    if (currentValue) {
      const newValue = (parseInt(currentValue) + 1).toString();
      this.put('counter', newValue);
    }
  }
}

// Create singleton instance
const db = new SnapDB();
export default db;
