import { TransactionTypeEnum } from '@budgie/contracts';

import { isNotEmptyString } from '@rnw-community/shared';

import { PatternSuggestionOrchestratorConfig } from '../../interface/pattern-suggestion-orchestrator.interface';
import { AiSuggestionOrchestrator } from '../ai-suggestion-orchestrator/ai-suggestion-orchestrator';
import { PatternSuggestionOrchestrator } from '../pattern-suggestion-orchestrator/pattern-suggestion-orchestrator';

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

const NEW_TRANSACTION_PATTERN_CONFIG: PatternSuggestionOrchestratorConfig = {
    loadPatternBeforeCategorySelection: true,
    allowPatternComments: true,
    autoFillAmountFromPattern: true
};

export const SuggestionsContainer = (props: Props) => {
    const { isNewTransaction, ...orchestratorProps } = props;
    const isVoiceTransaction = isNewTransaction && isNotEmptyString(orchestratorProps.aiContext);

    if (!isNewTransaction) {
        return <AiSuggestionOrchestrator {...orchestratorProps} />;
    }

    if (isVoiceTransaction) {
        return <AiSuggestionOrchestrator {...orchestratorProps} />;
    }

    return <PatternSuggestionOrchestrator {...orchestratorProps} config={NEW_TRANSACTION_PATTERN_CONFIG} />;
};
