import { CategorizeInboxLabelKindEnum } from '@budgie/categorization';
import { RuleActionTypeEnum } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { useGetEnabledRulesQuery } from '../../rule/query/use-get-enabled-rules.query';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { findTransactionMatchingRuleIds } from '../../transaction/utils/find-transaction-matching-rule-ids.util';
import { filedTransactionsAtom } from '../constant/categorize-inbox-atoms.constant';
import { toCategorizeInboxTransactionIds } from '../utils/to-categorize-inbox-transaction-ids.util';

import type { CategorizeInboxContextValueInterface } from '../interface/categorize-inbox-context-value.interface';
import type { CategorizeInboxLastWriteStateInterface } from '../interface/categorize-inbox-last-write-state.interface';
import type { CategorizeInboxLastWriteInterface } from '../interface/categorize-inbox-last-write.interface';

const NO_LAST_WRITE_STATE: CategorizeInboxLastWriteStateInterface = { isTagged: false, isRuleCovered: false };

const noFiledTransactionsAtom = Atom.make(AsyncResult.success({ transactionIds: [], transactions: [] }));

export const useCategorizeInboxLastWriteState = (
    labelKind: CategorizeInboxLabelKindEnum,
    lastWrite: CategorizeInboxLastWriteInterface | null
): Pick<CategorizeInboxContextValueInterface, 'lastWrite' | 'lastWriteState'> => {
    const language = useSetting('language');
    const { enabledRules } = useGetEnabledRulesQuery();
    const transactionIds = isDefined(lastWrite) ? [...new Set(toCategorizeInboxTransactionIds(lastWrite.assignments))] : [];
    const result = useLiveAtomValue(
        isNotEmptyArray(transactionIds) ? filedTransactionsAtom([transactionIds, language]) : noFiledTransactionsAtom
    );

    const loadedTransactionIds: readonly number[] = AsyncResult.isSuccess(result) ? result.value.transactionIds : [];

    if (
        !isDefined(lastWrite) ||
        !AsyncResult.isSuccess(result) ||
        loadedTransactionIds.length !== transactionIds.length ||
        !transactionIds.every(transactionId => loadedTransactionIds.includes(transactionId))
    ) {
        return { lastWrite, lastWriteState: NO_LAST_WRITE_STATE };
    }

    const transactionsById = new Map(result.value.transactions.map(transaction => [transaction.id, transaction]));

    const labelIds = new Set(lastWrite.assignments.map(({ labelId }) => labelId));
    const isTagKind = labelKind === CategorizeInboxLabelKindEnum.TAG;
    const labelRules = enabledRules.filter(rule =>
        rule.actions.some(action => {
            const actionLabelId = isTagKind ? action.tagId : action.categoryId;
            const actionType = isTagKind ? RuleActionTypeEnum.ADD_TAG : RuleActionTypeEnum.SET_CATEGORY;

            return action.type === actionType && isDefined(actionLabelId) && labelIds.has(actionLabelId);
        })
    );
    const filed = lastWrite.assignments.flatMap(({ labelId, rows }) =>
        rows.map(row => ({ labelId, row, transaction: transactionsById.get(row.transactionId) }))
    );

    const isSuperseded = filed.some(({ labelId, transaction }) => {
        if (!isDefined(transaction)) {
            return true;
        }

        return isTagKind
            ? !transaction.transactionTags.some(({ tagId }) => tagId === labelId)
            : !transaction.entries.some(entry => entry.categoryId === labelId);
    });

    return {
        lastWrite: isSuperseded ? null : lastWrite,
        lastWriteState: {
            isTagged: filed.some(({ row, transaction }) =>
                isDefined(transaction) ? transaction.transactionTags.some(({ tagId }) => !row.tagIds.includes(tagId)) : false
            ),
            isRuleCovered: [...transactionsById.values()].some(transaction =>
                isNotEmptyArray(findTransactionMatchingRuleIds(labelRules, transaction))
            )
        }
    };
};
