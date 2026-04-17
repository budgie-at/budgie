import { useEffect, useReducer } from 'react';

import { PatternSuggestionOrchestratorConfig } from '../interface/pattern-suggestion-orchestrator-config.type';
import { PatternSuggestionOrchestratorFacts } from '../interface/pattern-suggestion-orchestrator-facts.type';
import {
    PatternSuggestionOrchestratorActionTypeEnum,
    patternSuggestionOrchestratorInitialState,
    patternSuggestionOrchestratorReducer
} from '../reducer/pattern-suggestion-orchestrator.reducer';
import { SuggestionOrchestratorStepEnum } from '../type/suggestion-orchestrator-step.enum';

export const usePatternSuggestionOrchestrator = (
    config: PatternSuggestionOrchestratorConfig,
    facts: PatternSuggestionOrchestratorFacts
): SuggestionOrchestratorStepEnum => {
    const [state, dispatch] = useReducer(patternSuggestionOrchestratorReducer, patternSuggestionOrchestratorInitialState);
    const { loadPatternBeforeCategorySelection, allowPatternComments, autoFillAmountFromPattern } = config;
    const { isSplitActive, canUsePattern, hasCategorySelected, hasTagsSelected, hasComment, hasPatternTags, hasPatternComments } = facts;

    useEffect(() => {
        dispatch({
            type: PatternSuggestionOrchestratorActionTypeEnum.RESOLVE_STEP,
            payload: {
                config: {
                    loadPatternBeforeCategorySelection,
                    allowPatternComments,
                    autoFillAmountFromPattern
                },
                facts: {
                    isSplitActive,
                    canUsePattern,
                    hasCategorySelected,
                    hasTagsSelected,
                    hasComment,
                    hasPatternTags,
                    hasPatternComments
                }
            }
        });
    }, [
        loadPatternBeforeCategorySelection,
        allowPatternComments,
        autoFillAmountFromPattern,
        isSplitActive,
        canUsePattern,
        hasCategorySelected,
        hasTagsSelected,
        hasComment,
        hasPatternTags,
        hasPatternComments
    ]);

    return state.step;
};
