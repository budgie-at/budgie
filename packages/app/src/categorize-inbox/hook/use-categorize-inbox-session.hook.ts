import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { categorizeInboxEngineService } from '../service/categorize-inbox-engine.service';

import type { CategorizeInboxDataInterface } from '../interface/categorize-inbox-data.interface';
import type { CategorizeInboxSessionInterface } from '../interface/categorize-inbox-session.interface';
import type { CategorizeInboxViewInterface } from '../interface/categorize-inbox-view.interface';

const LOADING_SESSION: CategorizeInboxSessionInterface = { placements: new Map(), clustersByKey: new Map() };

export const useCategorizeInboxSession = (
    { rows, context, isLoading }: CategorizeInboxDataInterface,
    hiddenTransactionIds: ReadonlySet<number>
): CategorizeInboxViewInterface => {
    const [session, setSession] = useState<CategorizeInboxSessionInterface | null>(null);

    const clusters = categorizeInboxEngineService.buildClusters(rows, context);

    if (!isDefined(session) && !isLoading) {
        setSession(categorizeInboxEngineService.startSession(clusters));
    }

    const view = categorizeInboxEngineService.placeClusters(
        clusters,
        session ?? LOADING_SESSION,
        hiddenTransactionIds,
        context.defaultInstrumentId
    );

    if (isDefined(session) && view.clustersByKey !== session.clustersByKey) {
        setSession({ ...session, clustersByKey: view.clustersByKey });
    }

    return view;
};
