let revision = 0;
const listeners = new Set<() => void>();

export const databaseLiveQueryRevisionStore = {
    subscribe(listener: () => void): () => void {
        listeners.add(listener);

        return () => {
            listeners.delete(listener);
        };
    },
    getSnapshot(): number {
        return revision;
    },
    notifyChanged(): void {
        revision += 1;
        listeners.forEach(listener => {
            listener();
        });
    }
};
