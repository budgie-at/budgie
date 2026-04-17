export class AiNotReadyError extends Error {
    constructor(subsystem: 'chat' | 'embedding' | 'stt') {
        super(`AI subsystem "${subsystem}" is not ready`);
        this.name = 'AiNotReadyError';
    }
}
