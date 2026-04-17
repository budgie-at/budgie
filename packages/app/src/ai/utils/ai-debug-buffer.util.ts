import { AiDebugEventInterface } from '../interface/ai-debug-event.interface';

const BUFFER_LIMIT = 50;

const buffer: AiDebugEventInterface[] = [];
const listeners = new Set<() => void>();

export const aiDebugBuffer = {
    push(event: AiDebugEventInterface): void {
        buffer.push(event);
        if (buffer.length > BUFFER_LIMIT) {
            buffer.shift();
        }
        listeners.forEach(listener => {
            listener();
        });
    },
    snapshot(): readonly AiDebugEventInterface[] {
        return [...buffer];
    },
    subscribe(listener: () => void): () => void {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }
};
