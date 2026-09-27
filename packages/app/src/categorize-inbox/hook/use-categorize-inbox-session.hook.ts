import { useState } from 'react';

import { categorizeInboxEngineService } from '../service/categorize-inbox-engine.service';

import type { CategorizeInboxDataInterface } from '../interface/categorize-inbox-data.interface';
import type { CategorizeInboxSessionViewInterface } from '../interface/categorize-inbox-session-view.interface';

export const useCategorizeInboxSession = (
    { rows, context, isLoading }: CategorizeInboxDataInterface,
    hiddenTransactionIds: ReadonlySet<number>
): CategorizeInboxSessionViewInterface => {
    const [session, setSession] = useState(() => categorizeInboxEngineService.startSession());

    const { items, remainingCount, placements, clustersByKey } = categorizeInboxEngineService.placeClusters(
        categorizeInboxEngineService.buildClusters(rows, context),
        session,
        hiddenTransactionIds,
        context.defaultInstrumentId
    );
    const peakRowCount = Math.max(session.peakRowCount, new Set(rows.map(row => row.transactionId)).size);
    const hasSessionChanged =
        placements !== session.placements || clustersByKey !== session.clustersByKey || peakRowCount !== session.peakRowCount;

    if (!isLoading && hasSessionChanged) {
        setSession({ placements, clustersByKey, peakRowCount });
    }

    return { items, remainingCount, categorizedCount: Math.max(0, peakRowCount - remainingCount) };
};
