import { addDatabaseChangeListener } from 'expo-sqlite';

import { emptyFn, isDefined } from '@rnw-community/shared';

import type { DatabaseChangeEvent } from 'expo-sqlite';

class DatabaseRefreshService {
    private static readonly COALESCE_MS = 50;

    private version = 0;
    private pendingEmit: ReturnType<typeof setTimeout> | null = null;
    private tableChangeSubscription: ReturnType<typeof addDatabaseChangeListener> | null = null;
    private readonly tableVersions = new Map<string | null, number>();
    private readonly changedTableNames = new Set<string>();
    private readonly listeners = new Set<() => void>();

    readonly subscribe = (listener: () => void): (() => void) => {
        this.tableChangeSubscription ??= addDatabaseChangeListener(this.notifyTableChanged);
        this.listeners.add(listener);

        const unsubscribe = () => {
            this.listeners.delete(listener);
        };

        return unsubscribe;
    };

    getSnapshot(tableName: string | null): number {
        return this.version + (this.tableVersions.get(tableName) ?? 0);
    }

    notifyChanged(): void {
        this.version += 1;
        this.notifyListeners();
    }

    private readonly notifyTableChanged = (event: DatabaseChangeEvent): void => {
        this.changedTableNames.add(event.tableName);
        this.scheduleEmit();
    };

    private scheduleEmit(): void {
        if (!isDefined(this.pendingEmit)) {
            this.pendingEmit = setTimeout(this.emitTableChanges, DatabaseRefreshService.COALESCE_MS);
        }
    }

    private readonly emitTableChanges = (): void => {
        this.pendingEmit = null;
        this.changedTableNames.forEach(tableName => {
            this.tableVersions.set(tableName, (this.tableVersions.get(tableName) ?? 0) + 1);
        });
        this.changedTableNames.clear();
        this.notifyListeners();
    };

    private notifyListeners(): void {
        this.listeners.forEach(listener => {
            try {
                listener();
            } catch {
                emptyFn();
            }
        });
    }
}

export const databaseRefreshService = new DatabaseRefreshService();
