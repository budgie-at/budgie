import { subDays } from 'date-fns';
import { useEffect, useState, useSyncExternalStore } from 'react';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { transactionCategorizeInboxRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';
import { useNonSystemCategoriesQuery } from '../../category/query/use-non-system-categories.query';
import { useSettingsContext } from '../../settings/context/settings.context';
import { buildTransactionFilterKey } from '../../transaction/utils/build-transaction-filter-key.util';
import { categorizeInboxEngineService } from '../service/categorize-inbox-engine.service';
import { categorizeInboxEnrichmentService } from '../service/categorize-inbox-enrichment.service';

import type { UseCategorizeInboxReturnInterface } from '../interface/use-categorize-inbox-return.interface';
import type { TransactionFilterInterface } from '@budgie/contracts';

export const useCategorizeInbox = (filters: TransactionFilterInterface): UseCategorizeInboxReturnInterface => {
    const { categories, isLoading: isCategoriesLoading } = useNonSystemCategoriesQuery();
    const { defaultInstrument } = useSettingsContext();

    const [recentSince] = useState(() => subDays(new Date(), 365));

    const { data: rows, updatedAt: rowsUpdatedAt } = useDatabaseLiveQuery(
        transactionCategorizeInboxRepository.findUncategorizedRows(filters),
        [buildTransactionFilterKey(filters)]
    );
    const { data: evidence, updatedAt: evidenceUpdatedAt } = useDatabaseLiveQuery(
        transactionCategorizeInboxRepository.findLabeledEvidence(recentSince),
        [recentSince.getTime()]
    );
    const enrichmentSnapshot = useSyncExternalStore(
        categorizeInboxEnrichmentService.subscribe,
        categorizeInboxEnrichmentService.getSnapshot
    );

    const isLoading = isCategoriesLoading || !isDefined(rowsUpdatedAt) || !isDefined(evidenceUpdatedAt);
    const build = categorizeInboxEngineService.buildInboxWithRequests(rows, evidence, categories, defaultInstrument);
    const categoryKey = categories.map(category => category.id).join(',');
    const requestKey = build.enrichmentRequests
        .map(request => request.clusterKey)
        .sort()
        .join('|');

    useEffect(() => {
        if (isLoading) {
            return emptyFn;
        }

        categorizeInboxEnrichmentService.start(build.enrichmentRequests, categories);

        return () => {
            categorizeInboxEnrichmentService.stop();
        };
        // oxlint-disable-next-line react/exhaustive-deps -- keyed on loaded state, category ids and sorted request keys; requests are rebuilt when rows change
    }, [isLoading, categoryKey, requestKey]);

    return {
        inbox: categorizeInboxEngineService.applyEnrichments(build, enrichmentSnapshot.enrichments),
        isLoading,
        enrichmentStatus: enrichmentSnapshot.status
    };
};
