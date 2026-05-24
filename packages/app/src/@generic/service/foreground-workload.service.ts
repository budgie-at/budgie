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
