import { InstrumentMarketDataJobStatusEnum } from '@budgie/contracts';

export const isMarketHistoryLoading = (progress: {
    readonly status: InstrumentMarketDataJobStatusEnum | null;
    readonly isComplete: boolean;
}): boolean => progress.status !== InstrumentMarketDataJobStatusEnum.FAILED && !progress.isComplete;
