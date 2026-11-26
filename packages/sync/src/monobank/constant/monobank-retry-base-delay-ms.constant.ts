import * as Context from 'effect/Context';

const DEFAULT_MONOBANK_RETRY_BASE_DELAY_MS = 300;

export const MonobankRetryBaseDelayMs = Context.Reference<number>('@budgie/sync/MonobankRetryBaseDelayMs', {
    defaultValue: () => DEFAULT_MONOBANK_RETRY_BASE_DELAY_MS
});
