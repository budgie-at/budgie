import {
    SuggestionOrchestratorAction,
    SuggestionOrchestratorFacts,
    SuggestionOrchestratorPolicy,
    SuggestionOrchestratorState,
    SuggestionSourceEnum,
    SuggestionStageEnum
} from './suggestion-orchestrator.type';

const INITIAL_STAGE: SuggestionStageEnum = SuggestionStageEnum.NONE;

const resolveStageBySource = (
    sources: readonly SuggestionSourceEnum[],
    predicates: Record<SuggestionSourceEnum, boolean>,
    stages: Record<SuggestionSourceEnum, SuggestionStageEnum>
): SuggestionStageEnum => {
    for (const source of sources) {
        if (predicates[source]) {
            return stages[source];
        }
    }

    return INITIAL_STAGE;
};

const resolveCategoryStage = (policy: SuggestionOrchestratorPolicy, facts: SuggestionOrchestratorFacts): SuggestionStageEnum =>
    resolveStageBySource(
        policy.categorySources,
        {
            [SuggestionSourceEnum.AI]: facts.hasEmbeddingContext,
            [SuggestionSourceEnum.PATTERN]: facts.canUsePattern
        },
        {
            [SuggestionSourceEnum.AI]: SuggestionStageEnum.CATEGORY_AI,
            [SuggestionSourceEnum.PATTERN]: SuggestionStageEnum.CATEGORY_PATTERN
        }
    );

const resolveTagStage = (policy: SuggestionOrchestratorPolicy, facts: SuggestionOrchestratorFacts): SuggestionStageEnum =>
    resolveStageBySource(
        policy.tagSources,
        {
            [SuggestionSourceEnum.AI]: facts.hasEmbeddingContext,
            [SuggestionSourceEnum.PATTERN]: facts.canUsePattern && facts.hasPatternTags
        },
        {
            [SuggestionSourceEnum.AI]: SuggestionStageEnum.TAG_AI,
            [SuggestionSourceEnum.PATTERN]: SuggestionStageEnum.TAG_PATTERN
        }
    );

const resolveCommentStage = (policy: SuggestionOrchestratorPolicy, facts: SuggestionOrchestratorFacts): SuggestionStageEnum =>
    resolveStageBySource(
        policy.commentSources,
        {
            [SuggestionSourceEnum.AI]: facts.hasEmbeddingContext,
            [SuggestionSourceEnum.PATTERN]: policy.allowPatternComments && facts.canUsePattern && facts.hasPatternComments
        },
        {
            [SuggestionSourceEnum.AI]: SuggestionStageEnum.COMMENT_AI,
            [SuggestionSourceEnum.PATTERN]: SuggestionStageEnum.COMMENT_PATTERN
        }
    );

const resolveStage = (policy: SuggestionOrchestratorPolicy, facts: SuggestionOrchestratorFacts): SuggestionStageEnum => {
    if (facts.isSplitActive) {
        return INITIAL_STAGE;
    }

    if (!facts.hasCategorySelected) {
        return resolveCategoryStage(policy, facts);
    }

    if (!facts.hasTagsSelected) {
        const tagStage = resolveTagStage(policy, facts);
        if (tagStage !== INITIAL_STAGE) {
            return tagStage;
        }
    }

    if (!facts.hasComment) {
        return resolveCommentStage(policy, facts);
    }

    return INITIAL_STAGE;
};

export const suggestionOrchestratorInitialState: SuggestionOrchestratorState = {
    stage: INITIAL_STAGE
};

export const suggestionOrchestratorReducer = (
    state: SuggestionOrchestratorState,
    action: SuggestionOrchestratorAction
): SuggestionOrchestratorState => {
    const stage = resolveStage(action.payload.policy, action.payload.facts);

    if (stage === state.stage) {
        return state;
    }

    return { stage };
};
