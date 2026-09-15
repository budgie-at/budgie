import { emptyFn } from '@rnw-community/shared';

class ForegroundWorkloadService {
    private activeCount = 0;
    private readonly listeners = new Set<() => void>();

    isActive(): boolean {
        return this.activeCount > 0;
    }

    begin(): void {
        this.activeCount += 1;
        this.emit();
    }

    end(): void {
        this.activeCount = Math.max(0, this.activeCount - 1);
        this.emit();
    }

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    }

    async whenIdle(timeoutMs: number): Promise<boolean> {
        if (!this.isActive()) {
            return true;
        }

        return await new Promise<boolean>(resolve => {
            let unsubscribe = emptyFn;
            const timer = setTimeout(() => {
                unsubscribe();
                resolve(false);
            }, timeoutMs);

            unsubscribe = this.subscribe(() => {
                if (this.isActive()) {
                    return;
                }

                clearTimeout(timer);
                unsubscribe();
                resolve(true);
            });
        });
    }

    async run<T>(work: () => Promise<T>): Promise<T> {
        this.begin();

        try {
            return await work();
        } finally {
            this.end();
        }
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

export const foregroundWorkloadService = new ForegroundWorkloadService();
