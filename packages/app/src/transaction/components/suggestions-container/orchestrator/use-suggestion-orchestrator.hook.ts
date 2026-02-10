import { useEffect, useReducer } from 'react';

import { suggestionOrchestratorInitialState, suggestionOrchestratorReducer } from './suggestion-orchestrator.reducer';
import {
    SuggestionOrchestratorActionTypeEnum,
    SuggestionOrchestratorFacts,
    SuggestionOrchestratorPolicy,
    SuggestionStageEnum
} from './suggestion-orchestrator.type';

export const useSuggestionOrchestrator = (policy: SuggestionOrchestratorPolicy, facts: SuggestionOrchestratorFacts): SuggestionStageEnum => {
    const [state, dispatch] = useReducer(suggestionOrchestratorReducer, suggestionOrchestratorInitialState);

    useEffect(() => {
        dispatch({
            type: SuggestionOrchestratorActionTypeEnum.RESOLVE_STAGE,
            payload: {
                policy,
                facts
            }
        });
    }, [policy, facts]);

    return state.stage;
};
