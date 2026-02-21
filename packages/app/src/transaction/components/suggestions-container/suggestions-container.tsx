import { isNotEmptyString } from '@rnw-community/shared';

import { PatternSuggestionOrchestratorConfig } from '../../interface/pattern-suggestion-orchestrator-config.interface';
import { SuggestionOrchestratorSharedProps } from '../../interface/suggestion-orchestrator-shared-props.interface';
import { AiSuggestionOrchestrator } from '../ai-suggestion-orchestrator/ai-suggestion-orchestrator';
import { PatternSuggestionOrchestrator } from '../pattern-suggestion-orchestrator/pattern-suggestion-orchestrator';

interface Props extends SuggestionOrchestratorSharedProps {
    readonly isNewTransaction: boolean;
}

const NEW_TRANSACTION_PATTERN_CONFIG: PatternSuggestionOrchestratorConfig = {
    loadPatternBeforeCategorySelection: true,
    allowPatternComments: true,
    autoFillAmountFromPattern: true
};

export const SuggestionsContainer = (props: Props) => {
    const { isNewTransaction, ...orchestratorProps } = props;
    const isVoiceTransaction = isNewTransaction && isNotEmptyString(orchestratorProps.aiContext);

    if (!isNewTransaction || isVoiceTransaction) {
        return <AiSuggestionOrchestrator {...orchestratorProps} />;
    }

    return <PatternSuggestionOrchestrator {...orchestratorProps} config={NEW_TRANSACTION_PATTERN_CONFIG} />;
};
