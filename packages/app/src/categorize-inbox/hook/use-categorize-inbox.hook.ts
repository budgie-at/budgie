import { categorizeInboxEngineService, selectAcceptableAssignments } from '@budgie/categorization';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useState } from 'react';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { defaultInstrumentIdAtom } from '../../settings/constants/settings-atoms.constant';
import { atmCashWithdrawalTransactionIdsAtom } from '../constant/categorize-inbox-atoms.constant';

import type { CategorizeInboxDataInterface } from '../interface/categorize-inbox-data.interface';
import type { CategorizeInboxStrategyInterface } from '../interface/categorize-inbox-strategy.interface';
import type { CategorizeInboxVisibilityInterface } from '../interface/categorize-inbox-visibility.interface';
import type { CategorizeInboxRowInterface, CategorizeInboxSessionInterface, LabelEvidenceRowInterface } from '@budgie/categorization';
import type { TransactionFilterInterface } from '@budgie/contracts';

const EMPTY_INBOX: [CategorizeInboxRowInterface[], LabelEvidenceRowInterface[]] = [[], []];

const keepPresentTransactionIds = (transactionIds: Set<number>, rows: CategorizeInboxRowInterface[]): Set<number> => {
    const presentTransactionIds = new Set(rows.map(row => row.transactionId));
    const keptTransactionIds = new Set([...transactionIds].filter(transactionId => presentTransactionIds.has(transactionId)));

    return keptTransactionIds.size === transactionIds.size ? transactionIds : keptTransactionIds;
};

export const useCategorizeInbox = (
    filters: TransactionFilterInterface,
    { rowsAtom, evidenceAtom, labelKind }: Pick<CategorizeInboxStrategyInterface, 'rowsAtom' | 'evidenceAtom' | 'labelKind'>
): CategorizeInboxDataInterface => {
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const inboxResult = AsyncResult.all([useLiveAtomValue(rowsAtom(filters)), useLiveAtomValue(evidenceAtom)]);
    const [rows, evidence] = AsyncResult.getOrElse(inboxResult, () => EMPTY_INBOX);
    const cashWithdrawalResult = useLiveAtomValue(atmCashWithdrawalTransactionIdsAtom([...new Set(rows.map(row => row.transactionId))]));
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
    const { items, remainingCount, placements, clustersByKey } = categorizeInboxEngineService.placeClusters(
        categorizeInboxEngineService.buildClusters(
            rows,
            categorizeInboxEngineService.buildContext(evidence, defaultInstrumentId, labelKind)
        ),
        session,
        transactionIdSets.hidden,
        defaultInstrumentId
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
        !AsyncResult.isInitial(inboxResult) &&
        (placements !== session.placements || clustersByKey !== session.clustersByKey || peakRowCount !== session.peakRowCount)
    ) {
        setSession({ placements, clustersByKey, peakRowCount });
    }

    return {
        isLoading: AsyncResult.isInitial(inboxResult),
        items,
        remainingCount,
        categorizedCount: Math.max(0, peakRowCount - remainingCount),
        acceptableAssignments: selectAcceptableAssignments(items, transactionIdSets.excluded),
        cashWithdrawalTransactionIds: new Set(AsyncResult.getOrElse(cashWithdrawalResult, () => [])),
        visibility
    };
};
