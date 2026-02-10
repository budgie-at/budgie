export enum SuggestionSourceEnum {
    AI = 'ai',
    PATTERN = 'pattern'
}

export enum SuggestionStageEnum {
    NONE = 'none',
    CATEGORY_AI = 'category-ai',
    CATEGORY_PATTERN = 'category-pattern',
    TAG_AI = 'tag-ai',
    TAG_PATTERN = 'tag-pattern',
    COMMENT_AI = 'comment-ai',
    COMMENT_PATTERN = 'comment-pattern'
}

export enum SuggestionOrchestratorActionTypeEnum {
    RESOLVE_STAGE = 'resolve-stage'
}

export interface SuggestionOrchestratorPolicy {
    readonly categorySources: readonly SuggestionSourceEnum[];
    readonly tagSources: readonly SuggestionSourceEnum[];
    readonly commentSources: readonly SuggestionSourceEnum[];
    readonly loadPatternBeforeCategorySelection: boolean;
    readonly allowPatternComments: boolean;
    readonly autoFillAmountFromPattern: boolean;
}

export interface SuggestionOrchestratorFacts {
    readonly isSplitActive: boolean;
    readonly hasEmbeddingContext: boolean;
    readonly hasCategorySelected: boolean;
    readonly hasTagsSelected: boolean;
    readonly hasComment: boolean;
    readonly canUsePattern: boolean;
    readonly hasPatternTags: boolean;
    readonly hasPatternComments: boolean;
}

export interface SuggestionOrchestratorState {
    readonly stage: SuggestionStageEnum;
}

export type SuggestionOrchestratorAction = {
    readonly type: SuggestionOrchestratorActionTypeEnum.RESOLVE_STAGE;
    readonly payload: {
        readonly policy: SuggestionOrchestratorPolicy;
        readonly facts: SuggestionOrchestratorFacts;
    };
};
