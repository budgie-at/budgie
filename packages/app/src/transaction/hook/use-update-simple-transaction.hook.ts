import {
    CategorySourceEnum,
    ExpenseTransactionCreateInputSchema,
    IncomeTransactionCreateInputSchema,
    TransactionTypeEnum
} from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { useWatch } from 'react-hook-form';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { useEmbeddingGenerator } from '../../ai/hook/use-embedding-generator.hook';
import { usePendingReceipt } from '../../receipt/hook/use-pending-receipt.hook';
import { useSuggestRuleDetection } from '../../rule/hooks/use-suggest-rule-detection.hook';
import { convertTransactionToInput } from '../utils/convert-transaction-to-input.util';

import { useSimpleTransactionActionsMenu } from './use-simple-transaction-actions-menu.hook';
import { useTransactionFeeFormActions } from './use-transaction-fee-form-actions.hook';
import { useUpdateTransactionForm } from './use-update-transaction-form.hook';

import type { UpdateSimpleTransactionParamsInterface } from '../interface/update-simple-transaction-params.interface';
import type { ReceiptMatchInputInterface } from '@budgie/ledger';
import type { RuleEvaluationInputInterface } from '@budgie/rules';

const applyReceiptPrefill = (
    input: RuleEvaluationInputInterface,
    receipt: Pick<ReceiptMatchInputInterface, 'title' | 'categoryId'>
): RuleEvaluationInputInterface => {
    const [primaryEntry] = getTransactionCategoryEntries(input.entries);
    const shouldSetTitle = !isDefined(input.updatedBy) && isNotEmptyString(receipt.title);
    const shouldSetCategory = isDefined(primaryEntry) && !isDefined(primaryEntry.categoryId) && isDefined(receipt.categoryId);

    return {
        ...input,
        ...(shouldSetTitle && { title: receipt.title }),
        entries: input.entries.map(entry =>
            shouldSetCategory && entry === primaryEntry
                ? { ...entry, categoryId: receipt.categoryId, categorySource: CategorySourceEnum.AI }
                : entry
        )
    };
};

export const useUpdateSimpleTransaction = ({ transaction, transactionType, openFeeOnMount }: UpdateSimpleTransactionParamsInterface) => {
    const transactionId = transaction.id;
    const { learnCorrection } = useEmbeddingGenerator();

    const pendingReceipt = usePendingReceipt();
    const receipt = pendingReceipt?.transactionId === transactionId ? pendingReceipt.receipt : null;
    const transactionInput = convertTransactionToInput(transaction);

    const { form, handleSubmit, handleDelete } = useUpdateTransactionForm({
        transaction: isDefined(receipt) ? applyReceiptPrefill(transactionInput, receipt) : transactionInput,
        receipt,
        schema: transactionType === TransactionTypeEnum.EXPENSE ? ExpenseTransactionCreateInputSchema : IncomeTransactionCreateInputSchema,
        id: transactionId,
        onAfterSubmit: () => void learnCorrection(transactionId, transaction.entries.map(entry => entry.categoryId).filter(isDefined))
    });

    const ruleDetection = useSuggestRuleDetection({ transaction, control: form.control });

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
        handleSubmit,
        handleDelete,
        handleGoBack,
        ruleDetection
    };
};
