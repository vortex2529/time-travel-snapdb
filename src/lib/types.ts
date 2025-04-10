
export interface KeyValuePair {
  key: string;
  value: string;
  lastModified: Date;
}

export interface Snapshot {
  id: string;
  name: string;
  timestamp: Date;
  data: Record<string, KeyValuePair>;
  description?: string;
  tags?: string[];
}

export type SnapshotMetadata = Omit<Snapshot, 'data'>;

export interface DatabaseState {
  data: Record<string, KeyValuePair>;
  snapshots: Snapshot[];
  currentSnapshot: string | null;
}

export type OperationType = 'put' | 'delete' | 'snapshot' | 'restore' | 'clear';

export interface Operation {
  type: OperationType;
  timestamp: Date;
  key?: string;
  value?: string;
  snapshotId?: string;
  description?: string;
}
