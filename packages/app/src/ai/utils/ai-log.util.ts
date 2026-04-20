export const aiLog = (tag: string, data?: unknown): void => {
    if (!__DEV__) {
        return;
    }
    // eslint-disable-next-line no-console -- Structured diagnostic log for AI subsystem (user pre-approved in plan)
    console.log(`[AI] ${tag}`, data ?? '');
};
