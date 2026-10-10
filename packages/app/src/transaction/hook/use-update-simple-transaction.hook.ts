import { ExpenseTransactionCreateInputSchema, IncomeTransactionCreateInputSchema, TransactionTypeEnum } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { useEmbeddingGenerator } from '../../ai/hook/use-embedding-generator.hook';
import { useSuggestRuleDetection } from '../../rule/hooks/use-suggest-rule-detection.hook';
import { convertTransactionToInput } from '../utils/convert-transaction-to-input.util';

import { useSimpleTransactionActionsMenu } from './use-simple-transaction-actions-menu.hook';
import { useTransactionFeeFormActions } from './use-transaction-fee-form-actions.hook';
import { useUpdateTransactionForm } from './use-update-transaction-form.hook';

import type { UpdateSimpleTransactionParamsInterface } from '../interface/update-simple-transaction-params.interface';

export const useUpdateSimpleTransaction = ({ transaction, transactionType, openFeeOnMount }: UpdateSimpleTransactionParamsInterface) => {
    const transactionId = transaction.id;
    const { learnCorrection } = useEmbeddingGenerator();

    const { form, handleSubmit, handleDelete } = useUpdateTransactionForm({
        transaction: convertTransactionToInput(transaction),
        schema: transactionType === TransactionTypeEnum.EXPENSE ? ExpenseTransactionCreateInputSchema : IncomeTransactionCreateInputSchema,
        id: transactionId,
        onAfterSubmit: () => void learnCorrection(transactionId, transaction.entries.map(entry => entry.categoryId).filter(isDefined))
    });

    const {
        mode: ruleDetectionMode,
        suggestRuleData,
        updateRuleData,
        matchingRulesCount,
        matchingRuleIds,
        onRuleCreated,
        onDismiss,
        onCreatingChange
    } = useSuggestRuleDetection({
        transaction,
        control: form.control
    });

    const { formRef, handleFeePress } = useTransactionFeeFormActions(openFeeOnMount);
    const transactionAccountId = useWatch({
        control: form.control,
        name: transactionType === TransactionTypeEnum.EXPENSE ? 'fromAccountId' : 'toAccountId'
    });
    const entries = useWatch({ control: form.control, name: 'entries' });
    const categoryEntries = getTransactionCategoryEntries(entries);
    const { actionsMenuProps, debtSettlementAccount } = useSimpleTransactionActionsMenu({
        transaction,
        transactionAccountId,
        transactionType,
        categoryEntryCount: categoryEntries.length,
        onDelete: handleDelete,
        onFeePress: handleFeePress
    });

    const handleGoBack = () => void goBackOrReplace('/');

    return {
        form,
        formRef,
        actionsMenuProps,
        debtSettlementAccount,
        mccCategoryId: categoryEntries.at(0)?.mccCategoryId ?? null,
        handleSubmit,
        handleDelete,
        handleGoBack,
        isConsolidated: isDefined(transaction.consolidationType),
        ruleDetectionMode,
        suggestRuleData,
        updateRuleData,
        matchingRulesCount,
        matchingRuleIds,
        onRuleCreated,
        onDismiss,
        onCreatingChange
    };
};
