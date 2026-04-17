// TEMP DIAGNOSTIC — remove this util and all `aiSuggestLog(...)` call sites once suggestion flow is debugged.
export const aiSuggestLog = (tag: string, data?: unknown): void => {
    // eslint-disable-next-line no-console -- Temporary diagnostic for AI suggestion investigation
    console.log(`[AI-SUGGEST] ${tag}`, data ?? '');
};
