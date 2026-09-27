import { useState } from 'react';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';
import { useSettingsContext } from '../../settings/context/settings.context';
import { buildTransactionFilterKey } from '../../transaction/utils/build-transaction-filter-key.util';
import { CategorizeInboxSectionEnum } from '../enum/categorize-inbox-section.enum';
import { categorizeInboxEngineService } from '../service/categorize-inbox-engine.service';

import type { CategorizeInboxDataInterface } from '../interface/categorize-inbox-data.interface';
import type { CategorizeInboxSessionInterface } from '../interface/categorize-inbox-session.interface';
import type { CategorizeInboxStrategyInterface } from '../interface/categorize-inbox-strategy.interface';
import type { CategorizeInboxVisibilityInterface } from '../interface/categorize-inbox-visibility.interface';
import type { CategorizeInboxRowInterface, TransactionFilterInterface } from '@budgie/contracts';

const keepPresentTransactionIds = (transactionIds: Set<number>, rows: CategorizeInboxRowInterface[]): Set<number> => {
    const presentTransactionIds = new Set(rows.map(row => row.transactionId));
    const keptTransactionIds = new Set([...transactionIds].filter(transactionId => presentTransactionIds.has(transactionId)));

    return keptTransactionIds.size === transactionIds.size ? transactionIds : keptTransactionIds;
};

export const useCategorizeInbox = (
    filters: TransactionFilterInterface,
    { findRows, findEvidence }: Pick<CategorizeInboxStrategyInterface, 'findRows' | 'findEvidence'>
): CategorizeInboxDataInterface => {
    const { defaultInstrument } = useSettingsContext();
    const { data: rows, updatedAt: rowsUpdatedAt } = useDatabaseLiveQuery(findRows(filters), [buildTransactionFilterKey(filters)]);
    const { data: evidence, updatedAt: evidenceUpdatedAt } = useDatabaseLiveQuery(findEvidence());
    const [session, setSession] = useState<CategorizeInboxSessionInterface>({
        placements: new Map(),
        clustersByKey: new Map(),
        peakRowCount: 0
    });
    const [expandedClusterKey, setExpandedClusterKey] = useState<string | null>(null);
    const [transactionIdSets, setTransactionIdSets] = useState({ rows, hidden: new Set<number>(), excluded: new Set<number>() });

    const visibility: CategorizeInboxVisibilityInterface = {
        excludedTransactionIds: transactionIdSets.excluded,
        expandedClusterKey,
        includedRows: cluster => cluster.rows.filter(row => !transactionIdSets.excluded.has(row.transactionId)),
        toggleExpanded: clusterKey => void setExpandedClusterKey(previous => (previous === clusterKey ? null : clusterKey)),
        toggleExcluded: transactionId =>
            void setTransactionIdSets(previous => {
                const excluded = new Set(previous.excluded);

                if (!excluded.delete(transactionId)) {
                    excluded.add(transactionId);
                }

                return { ...previous, excluded };
            }),
        hideTransactions: transactionIds =>
            void setTransactionIdSets(previous => ({ ...previous, hidden: new Set([...previous.hidden, ...transactionIds]) })),
        showTransactions: transactionIds =>
            void setTransactionIdSets(previous => ({
                ...previous,
                hidden: new Set([...previous.hidden].filter(transactionId => !transactionIds.includes(transactionId)))
            }))
    };
    const isLoading = !isDefined(rowsUpdatedAt) || !isDefined(evidenceUpdatedAt);
    const { items, remainingCount, placements, clustersByKey } = categorizeInboxEngineService.placeClusters(
        categorizeInboxEngineService.buildClusters(rows, categorizeInboxEngineService.buildContext(evidence, defaultInstrument.id)),
        session,
        transactionIdSets.hidden,
        defaultInstrument.id
    );
    const peakRowCount = Math.max(session.peakRowCount, new Set(rows.map(row => row.transactionId)).size);

    if (transactionIdSets.rows !== rows) {
        setTransactionIdSets({
            rows,
            hidden: keepPresentTransactionIds(transactionIdSets.hidden, rows),
            excluded: keepPresentTransactionIds(transactionIdSets.excluded, rows)
        });
    }

    if (
        !isLoading &&
        (placements !== session.placements || clustersByKey !== session.clustersByKey || peakRowCount !== session.peakRowCount)
    ) {
        setSession({ placements, clustersByKey, peakRowCount });
    }

    return {
        isLoading,
        items,
        remainingCount,
        categorizedCount: Math.max(0, peakRowCount - remainingCount),
        acceptableAssignments: items.flatMap(item => {
            const labelId = 'rows' in item && item.section === CategorizeInboxSectionEnum.CONFIDENT ? item.candidateLabelIds.at(0) : null;
            const includedRows = 'rows' in item ? item.rows.filter(row => !transactionIdSets.excluded.has(row.transactionId)) : [];

            return 'rows' in item && isDefined(labelId) && isNotEmptyArray(includedRows) ? [{ ...item, rows: includedRows, labelId }] : [];
        }),
        visibility
    };
};
