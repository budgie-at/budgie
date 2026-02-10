import { SuggestionOrchestratorBase, SuggestionOrchestratorSharedProps } from './suggestion-orchestrator-base';
import { SuggestionOrchestratorPolicy, SuggestionSourceEnum } from './suggestion-orchestrator.type';

const NEW_TRANSACTION_POLICY: SuggestionOrchestratorPolicy = {
    categorySources: [SuggestionSourceEnum.AI, SuggestionSourceEnum.PATTERN],
    tagSources: [SuggestionSourceEnum.AI, SuggestionSourceEnum.PATTERN],
    commentSources: [SuggestionSourceEnum.AI, SuggestionSourceEnum.PATTERN],
    loadPatternBeforeCategorySelection: true,
    allowPatternComments: true,
    autoFillAmountFromPattern: true
};

export const NewTransactionSuggestionsOrchestrator = (props: SuggestionOrchestratorSharedProps) => (
    <SuggestionOrchestratorBase {...props} policy={NEW_TRANSACTION_POLICY} />
);
