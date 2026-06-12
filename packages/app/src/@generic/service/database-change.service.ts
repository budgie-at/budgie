import { emptyFn } from '@rnw-community/shared';

class DatabaseChangeService {
    private revision = 0;
    private readonly listeners = new Set<() => void>();

    getSnapshot(): number {
        return this.revision;
    }

    markChanged(): void {
        this.revision += 1;
        this.emit();
    }

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
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

export const databaseChangeService = new DatabaseChangeService();
