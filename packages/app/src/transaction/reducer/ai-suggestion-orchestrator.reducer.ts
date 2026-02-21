import { AiSuggestionOrchestratorFacts } from '../interface/ai-suggestion-orchestrator.interface';
import { SuggestionOrchestratorStepEnum } from '../type/suggestion-orchestrator-step.enum';

export enum AiSuggestionOrchestratorActionTypeEnum {
    RESOLVE_STEP = 'resolve-step'
}

interface AiSuggestionOrchestratorState {
    readonly step: SuggestionOrchestratorStepEnum;
}

interface AiSuggestionOrchestratorAction {
    readonly type: AiSuggestionOrchestratorActionTypeEnum.RESOLVE_STEP;
    readonly payload: {
        readonly facts: AiSuggestionOrchestratorFacts;
    };
}

const INITIAL_STEP: SuggestionOrchestratorStepEnum = SuggestionOrchestratorStepEnum.NONE;

const resolveAiStep = (facts: AiSuggestionOrchestratorFacts): SuggestionOrchestratorStepEnum => {
    if (facts.isSplitActive || !facts.hasEmbeddingContext) {
        return INITIAL_STEP;
    }

    if (!facts.hasCategorySelected) {
        return SuggestionOrchestratorStepEnum.CATEGORY;
    }

    if (!facts.hasTagsSelected) {
        return SuggestionOrchestratorStepEnum.TAG;
    }

    if (!facts.hasComment) {
        return SuggestionOrchestratorStepEnum.COMMENT;
    }

    return INITIAL_STEP;
};

export const aiSuggestionOrchestratorInitialState: AiSuggestionOrchestratorState = {
    step: INITIAL_STEP
};

export const aiSuggestionOrchestratorReducer = (
    state: AiSuggestionOrchestratorState,
    action: AiSuggestionOrchestratorAction
): AiSuggestionOrchestratorState => {
    const step = resolveAiStep(action.payload.facts);
    if (step === state.step) {
        return state;
    }

    return { step };
};
