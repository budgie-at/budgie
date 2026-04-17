// TEMP DIAGNOSTIC — remove this util and all `bankSyncLog(...)` call sites once monobank sync symptom is diagnosed.
export const bankSyncLog = (tag: string, data?: unknown): void => {
    if (!__DEV__) {
        return;
    }
    // eslint-disable-next-line no-console -- Temporary diagnostic for monobank sync investigation
    console.log(`[BANK-SYNC] ${tag}`, data ?? '');
};
