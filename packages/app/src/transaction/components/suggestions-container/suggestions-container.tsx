import { TransactionTypeEnum } from '@budgie/contracts';

import { isNotEmptyString } from '@rnw-community/shared';

import { ExistingTransactionSuggestionsOrchestrator } from './orchestrator/existing-transaction-suggestions-orchestrator';
import { NewTransactionSuggestionsOrchestrator } from './orchestrator/new-transaction-suggestions-orchestrator';
import { VoiceTransactionSuggestionsOrchestrator } from './orchestrator/voice-transaction-suggestions-orchestrator';

interface Props {
    readonly isNewTransaction: boolean;
    readonly isSplitActive: boolean;
    readonly transactionType: TransactionTypeEnum;
    readonly transactionTitle: string;
    readonly categoryId: number | null;
    readonly mccCategoryId: number | null;
    readonly comment: string;
    readonly aiContext: string;
    readonly accountId: number;
    readonly amount: number;
    readonly hasTagsSelected: boolean;
    readonly onSelectCategory: (categoryId: number) => void;
    readonly onSelectTag: (tagId: number) => void;
    readonly onSelectComment: (comment: string) => void;
    readonly onFillPatternAmount: (amount: number) => void;
}

export const SuggestionsContainer = (props: Props) => {
    const { isNewTransaction, ...orchestratorProps } = props;
    const isVoiceTransaction = isNewTransaction && isNotEmptyString(orchestratorProps.aiContext);

    if (!isNewTransaction) {
        return <ExistingTransactionSuggestionsOrchestrator {...orchestratorProps} />;
    }

    if (isVoiceTransaction) {
        return <VoiceTransactionSuggestionsOrchestrator {...orchestratorProps} />;
    }

    return <NewTransactionSuggestionsOrchestrator {...orchestratorProps} />;
};
