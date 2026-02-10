import { SuggestionOrchestratorBase, SuggestionOrchestratorSharedProps } from './suggestion-orchestrator-base';
import { SuggestionOrchestratorPolicy, SuggestionSourceEnum } from './suggestion-orchestrator.type';

const VOICE_TRANSACTION_POLICY: SuggestionOrchestratorPolicy = {
    categorySources: [SuggestionSourceEnum.AI, SuggestionSourceEnum.PATTERN],
    tagSources: [SuggestionSourceEnum.AI, SuggestionSourceEnum.PATTERN],
    commentSources: [SuggestionSourceEnum.AI, SuggestionSourceEnum.PATTERN],
    loadPatternBeforeCategorySelection: true,
    allowPatternComments: true,
    autoFillAmountFromPattern: false
};

export const VoiceTransactionSuggestionsOrchestrator = (props: SuggestionOrchestratorSharedProps) => (
    <SuggestionOrchestratorBase {...props} policy={VOICE_TRANSACTION_POLICY} />
);
