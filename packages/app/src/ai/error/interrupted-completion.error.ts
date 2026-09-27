export class InterruptedCompletionError extends Error {
    constructor() {
        // oxlint-disable-next-line lingui/no-unlocalized-strings -- Internal error, not user-facing
        super('Completion was interrupted before it finished');
        // oxlint-disable-next-line lingui/no-unlocalized-strings -- Error class name, not user-facing
        this.name = 'InterruptedCompletionError';
    }
}
