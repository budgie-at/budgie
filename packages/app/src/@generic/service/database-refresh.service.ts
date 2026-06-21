import { emptyFn } from '@rnw-community/shared';

class DatabaseRefreshService {
    private version = 0;
    private readonly listeners = new Set<() => void>();

    readonly subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    };

    readonly getSnapshot = (): number => this.version;

    notifyChanged(): void {
        this.version += 1;
        this.emit();
    }

    private emit(): void {
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
