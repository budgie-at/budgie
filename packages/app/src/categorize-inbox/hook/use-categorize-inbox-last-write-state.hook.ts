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

import type { CategorizeInboxLastWriteStateInterface } from '../interface/categorize-inbox-last-write-state.interface';
import type { CategorizeInboxLastWriteInterface } from '../interface/categorize-inbox-last-write.interface';

const NO_LAST_WRITE_STATE: CategorizeInboxLastWriteStateInterface = { isSuperseded: false, isTagged: false, isRuleCovered: false };

const noFiledTransactionsAtom = Atom.make(AsyncResult.success([]));

export const useCategorizeInboxLastWriteState = (
    labelKind: CategorizeInboxLabelKindEnum,
    lastWrite: CategorizeInboxLastWriteInterface | null
): CategorizeInboxLastWriteStateInterface => {
    const language = useSetting('language');
    const { enabledRules } = useGetEnabledRulesQuery();
    const transactionIds = isDefined(lastWrite) ? [...new Set(toCategorizeInboxTransactionIds(lastWrite.assignments))] : [];
    const result = useLiveAtomValue(
        isNotEmptyArray(transactionIds) ? filedTransactionsAtom([transactionIds, language]) : noFiledTransactionsAtom
    );

    if (!isDefined(lastWrite) || !AsyncResult.isSuccess(result)) {
        return NO_LAST_WRITE_STATE;
    }

    const labelIds = new Set(lastWrite.assignments.map(({ labelId }) => labelId));
    const isTagKind = labelKind === CategorizeInboxLabelKindEnum.TAG;
    const labelRules = enabledRules.filter(rule =>
        rule.actions.some(action => {
            const actionLabelId = isTagKind ? action.tagId : action.categoryId;
            const actionType = isTagKind ? RuleActionTypeEnum.ADD_TAG : RuleActionTypeEnum.SET_CATEGORY;

            return action.type === actionType && isDefined(actionLabelId) && labelIds.has(actionLabelId);
        })
    );
    const transactionsById = new Map(result.value.map(transaction => [transaction.id, transaction]));
    const filed = lastWrite.assignments.flatMap(({ labelId, rows }) =>
        rows.map(row => ({ labelId, row, transaction: transactionsById.get(row.transactionId) }))
    );

    return {
        isSuperseded: filed.some(({ labelId, transaction }) => {
            if (!isDefined(transaction)) {
                return true;
            }

            return isTagKind
                ? !transaction.transactionTags.some(({ tagId }) => tagId === labelId)
                : !transaction.entries.some(entry => entry.categoryId === labelId);
        }),
        isTagged: filed.some(({ row, transaction }) =>
            isDefined(transaction) ? transaction.transactionTags.some(({ tagId }) => !row.tagIds.includes(tagId)) : false
        ),
        isRuleCovered: result.value.some(transaction => isNotEmptyArray(findTransactionMatchingRuleIds(labelRules, transaction)))
    };
};
