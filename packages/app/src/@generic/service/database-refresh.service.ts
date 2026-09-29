import * as Effect from 'effect/Effect';

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
            Effect.runSync(Effect.ignore(Effect.try(listener)));
        });
    }
}

export const databaseRefreshService = new DatabaseRefreshService();
