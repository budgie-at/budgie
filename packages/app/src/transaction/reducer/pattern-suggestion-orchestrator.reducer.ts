import { PatternSuggestionOrchestratorConfig } from '../interface/pattern-suggestion-orchestrator-config.interface';
import { PatternSuggestionOrchestratorFacts } from '../interface/pattern-suggestion-orchestrator-facts.interface';
import { SuggestionOrchestratorStepEnum } from '../type/suggestion-orchestrator-step.enum';

export enum PatternSuggestionOrchestratorActionTypeEnum {
    RESOLVE_STEP = 'resolve-step'
}

interface PatternSuggestionOrchestratorState {
    readonly step: SuggestionOrchestratorStepEnum;
}

interface PatternSuggestionOrchestratorAction {
    readonly type: PatternSuggestionOrchestratorActionTypeEnum.RESOLVE_STEP;
    readonly payload: {
        readonly config: PatternSuggestionOrchestratorConfig;
        readonly facts: PatternSuggestionOrchestratorFacts;
    };
}

const INITIAL_STEP: SuggestionOrchestratorStepEnum = SuggestionOrchestratorStepEnum.NONE;

const resolvePatternStep = (
    config: PatternSuggestionOrchestratorConfig,
    facts: PatternSuggestionOrchestratorFacts
): SuggestionOrchestratorStepEnum => {
    if (facts.isSplitActive || !facts.canUsePattern) {
        return INITIAL_STEP;
    }

    if (!facts.hasCategorySelected) {
        return config.loadPatternBeforeCategorySelection ? SuggestionOrchestratorStepEnum.CATEGORY : INITIAL_STEP;
    }

    if (!facts.hasTagsSelected && facts.hasPatternTags) {
        return SuggestionOrchestratorStepEnum.TAG;
    }

    if (!facts.hasComment && config.allowPatternComments && facts.hasPatternComments) {
        return SuggestionOrchestratorStepEnum.COMMENT;
    }

    return INITIAL_STEP;
};

export const patternSuggestionOrchestratorInitialState: PatternSuggestionOrchestratorState = {
    step: INITIAL_STEP
};

export const patternSuggestionOrchestratorReducer = (
    state: PatternSuggestionOrchestratorState,
    action: PatternSuggestionOrchestratorAction
): PatternSuggestionOrchestratorState => {
    const step = resolvePatternStep(action.payload.config, action.payload.facts);
    if (step === state.step) {
        return state;
    }

    return { step };
};
