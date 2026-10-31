import { categorizeInboxEngineService, selectAcceptableAssignments } from '@budgie/categorization';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useReducer } from 'react';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { defaultInstrumentIdAtom } from '../../settings/constants/settings-atoms.constant';
import { atmCashWithdrawalTransactionIdsAtom } from '../constant/categorize-inbox-atoms.constant';
import { CategorizeInboxActionTypeEnum } from '../enum/categorize-inbox-action-type.enum';

import type { CategorizeInboxActionInterface } from '../interface/categorize-inbox-action.interface';
import type { CategorizeInboxDataInterface } from '../interface/categorize-inbox-data.interface';
import type { CategorizeInboxStateInterface } from '../interface/categorize-inbox-state.interface';
import type { CategorizeInboxStrategyInterface } from '../interface/categorize-inbox-strategy.interface';
import type { CategorizeInboxVisibilityInterface } from '../interface/categorize-inbox-visibility.interface';
import type { CategorizeInboxRowInterface, LabelEvidenceRowInterface } from '@budgie/categorization';
import type { TransactionFilterInterface } from '@budgie/contracts';

const EMPTY_INBOX: [CategorizeInboxRowInterface[], LabelEvidenceRowInterface[]] = [[], []];

const keepPresentTransactionIds = (transactionIds: Set<number>, rows: CategorizeInboxRowInterface[]): Set<number> => {
    const presentTransactionIds = new Set(rows.map(row => row.transactionId));
    const keptTransactionIds = new Set([...transactionIds].filter(transactionId => presentTransactionIds.has(transactionId)));

    return keptTransactionIds.size === transactionIds.size ? transactionIds : keptTransactionIds;
};

const setExclusion = (excluded: Set<number>, transactionIds: readonly number[], isExcluded: boolean): Set<number> =>
    isExcluded
        ? new Set([...excluded, ...transactionIds])
        : new Set([...excluded].filter(transactionId => !transactionIds.includes(transactionId)));

const reducer = (state: CategorizeInboxStateInterface, action: CategorizeInboxActionInterface): CategorizeInboxStateInterface => {
    if (action.type === CategorizeInboxActionTypeEnum.EXCLUSION_TOGGLED) {
        const excluded = new Set(state.excluded);

        if (!excluded.delete(action.transactionId)) {
            excluded.add(action.transactionId);
        }

        return { ...state, excluded };
    }
    if (action.type === CategorizeInboxActionTypeEnum.EXCLUSION_SET) {
        return { ...state, excluded: setExclusion(state.excluded, action.transactionIds, action.isExcluded) };
    }
    if (action.type === CategorizeInboxActionTypeEnum.TRANSACTIONS_HIDDEN) {
        return { ...state, hidden: new Set([...state.hidden, ...action.transactionIds]) };
    }
    if (action.type === CategorizeInboxActionTypeEnum.TRANSACTIONS_SHOWN) {
        return { ...state, hidden: new Set([...state.hidden].filter(transactionId => !action.transactionIds.includes(transactionId))) };
    }
    if (action.type === CategorizeInboxActionTypeEnum.ROWS_CHANGED) {
        return {
            ...state,
            rows: action.rows,
            hidden: keepPresentTransactionIds(state.hidden, action.rows),
            excluded: keepPresentTransactionIds(state.excluded, action.rows)
        };
    }

    return { ...state, session: action.session };
};

export const useCategorizeInbox = (
    filters: TransactionFilterInterface,
    { rowsAtom, evidenceAtom, labelKind }: Pick<CategorizeInboxStrategyInterface, 'rowsAtom' | 'evidenceAtom' | 'labelKind'>
): CategorizeInboxDataInterface => {
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const inboxResult = AsyncResult.all([useLiveAtomValue(rowsAtom(filters)), useLiveAtomValue(evidenceAtom)]);
    const [rows, evidence] = AsyncResult.getOrElse(inboxResult, () => EMPTY_INBOX);
    const cashWithdrawalResult = useLiveAtomValue(atmCashWithdrawalTransactionIdsAtom([...new Set(rows.map(row => row.transactionId))]));
    const [state, dispatch] = useReducer(reducer, {
        session: { placements: new Map(), clustersByKey: new Map(), peakRowCount: 0 },
        rows,
        hidden: new Set<number>(),
        excluded: new Set<number>()
    });
    const { session } = state;

    const visibility: CategorizeInboxVisibilityInterface = {
        excludedTransactionIds: state.excluded,
        includedRows: cluster => cluster.rows.filter(row => !state.excluded.has(row.transactionId)),
        toggleExcluded: transactionId => void dispatch({ type: CategorizeInboxActionTypeEnum.EXCLUSION_TOGGLED, transactionId }),
        setExcluded: (transactionIds, isExcluded) =>
            void dispatch({ type: CategorizeInboxActionTypeEnum.EXCLUSION_SET, transactionIds, isExcluded }),
        hideTransactions: transactionIds => void dispatch({ type: CategorizeInboxActionTypeEnum.TRANSACTIONS_HIDDEN, transactionIds }),
        showTransactions: transactionIds => void dispatch({ type: CategorizeInboxActionTypeEnum.TRANSACTIONS_SHOWN, transactionIds })
    };
    const { items, remainingCount, placements, clustersByKey } = categorizeInboxEngineService.placeClusters(
        categorizeInboxEngineService.buildClusters(
            rows,
            categorizeInboxEngineService.buildContext(evidence, defaultInstrumentId, labelKind)
        ),
        session,
        state.hidden,
        defaultInstrumentId
    );
    const peakRowCount = Math.max(session.peakRowCount, new Set(rows.map(row => row.transactionId)).size);

    if (state.rows !== rows) {
        dispatch({ type: CategorizeInboxActionTypeEnum.ROWS_CHANGED, rows });
    }

    if (
        !AsyncResult.isInitial(inboxResult) &&
        (placements !== session.placements || clustersByKey !== session.clustersByKey || peakRowCount !== session.peakRowCount)
    ) {
        dispatch({ type: CategorizeInboxActionTypeEnum.SESSION_SYNCED, session: { placements, clustersByKey, peakRowCount } });
    }

    return {
        isLoading: AsyncResult.isInitial(inboxResult),
        items,
        remainingCount,
        categorizedCount: Math.max(0, peakRowCount - remainingCount),
        acceptableAssignments: selectAcceptableAssignments(items, state.excluded),
        cashWithdrawalTransactionIds: new Set(AsyncResult.getOrElse(cashWithdrawalResult, () => [])),
        visibility
    };
};
