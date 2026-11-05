import { ExternalSourceEnum } from '@budgie/contracts';

export const LIVE_SYNC_PROVIDERS: ReadonlySet<ExternalSourceEnum> = new Set([
    ExternalSourceEnum.BINANCE,
    ExternalSourceEnum.ENABLE_BANKING,
    ExternalSourceEnum.MONOBANK
]);
