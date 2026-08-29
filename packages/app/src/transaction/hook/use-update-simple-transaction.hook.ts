import { isDefined } from '@rnw-community/shared';

import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { useEmbeddingGenerator } from '../../ai/hook/use-embedding-generator.hook';
import { useSuggestRuleDetection } from '../../rule/hooks/use-suggest-rule-detection.hook';
import { convertTransactionToInput } from '../utils/convert-transaction-to-input.util';

import { useUpdateTransactionForm } from './use-update-transaction-form.hook';

import type { UpdateSimpleTransactionParamsInterface } from '../interface/update-simple-transaction-params.interface';

export const useUpdateSimpleTransaction = ({ transaction, transactionId, schema }: UpdateSimpleTransactionParamsInterface) => {
    const { markForEmbedding } = useEmbeddingGenerator();

    const { form, handleSubmit, handleDelete } = useUpdateTransactionForm({
        transaction: convertTransactionToInput(transaction),
        schema,
        id: transactionId,
        onAfterSubmit: () => void markForEmbedding(transactionId)
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

    const handleGoBack = () => void goBackOrReplace('/');

    return {
        form,
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
