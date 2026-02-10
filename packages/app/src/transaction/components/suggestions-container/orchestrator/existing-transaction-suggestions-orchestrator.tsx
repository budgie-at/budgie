import { SuggestionOrchestratorBase, SuggestionOrchestratorSharedProps } from './suggestion-orchestrator-base';
import { SuggestionOrchestratorPolicy, SuggestionSourceEnum } from './suggestion-orchestrator.type';

const EXISTING_TRANSACTION_POLICY: SuggestionOrchestratorPolicy = {
    categorySources: [SuggestionSourceEnum.AI],
    tagSources: [SuggestionSourceEnum.AI],
    commentSources: [SuggestionSourceEnum.AI, SuggestionSourceEnum.PATTERN],
    loadPatternBeforeCategorySelection: false,
    allowPatternComments: true,
    autoFillAmountFromPattern: false
};

export const ExistingTransactionSuggestionsOrchestrator = (props: SuggestionOrchestratorSharedProps) => (
    <SuggestionOrchestratorBase {...props} policy={EXISTING_TRANSACTION_POLICY} />
);
