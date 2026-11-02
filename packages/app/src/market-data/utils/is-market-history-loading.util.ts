import { InstrumentMarketDataJobStatusEnum } from '@budgie/contracts';

import type { useInstrumentMarketDataProgressQuery } from '../query/use-instrument-market-data-progress.query';

export const isMarketHistoryLoading = (
    progress: Pick<ReturnType<typeof useInstrumentMarketDataProgressQuery>, 'status' | 'isComplete'>
): boolean => progress.status !== InstrumentMarketDataJobStatusEnum.FAILED && !progress.isComplete;
