import { emptyFn } from '@rnw-community/shared';

class DatabaseRefreshService {
    private version = 0;
    private readonly listeners = new Set<() => void>();

    readonly subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);

        const unsubscribe = () => {
            this.listeners.delete(listener);
        };

        return unsubscribe;
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
