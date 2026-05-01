import { useEffect, useReducer } from 'react';

import { AiSuggestionOrchestratorFacts } from '../interface/ai-suggestion-orchestrator-facts.type';
import {
    AiSuggestionOrchestratorActionTypeEnum,
    aiSuggestionOrchestratorInitialState,
    aiSuggestionOrchestratorReducer
} from '../reducer/ai-suggestion-orchestrator.reducer';
import { SuggestionOrchestratorStepEnum } from '../type/suggestion-orchestrator-step.enum';

export const useAiSuggestionOrchestrator = (facts: AiSuggestionOrchestratorFacts): SuggestionOrchestratorStepEnum => {
    const [state, dispatch] = useReducer(aiSuggestionOrchestratorReducer, aiSuggestionOrchestratorInitialState);
    const { isSplitActive, hasEmbeddingContext, hasCategorySelected, hasTagsSelected, hasComment } = facts;

    useEffect(() => {
        dispatch({
            type: AiSuggestionOrchestratorActionTypeEnum.RESOLVE_STEP,
            payload: {
                facts: {
                    isSplitActive,
                    hasEmbeddingContext,
                    hasCategorySelected,
                    hasTagsSelected,
                    hasComment
                }
            }
        });
    }, [isSplitActive, hasEmbeddingContext, hasCategorySelected, hasTagsSelected, hasComment]);

    return state.step;
};
