export interface PatternSuggestionOrchestratorConfig {
    readonly loadPatternBeforeCategorySelection: boolean;
    readonly allowPatternComments: boolean;
    readonly autoFillAmountFromPattern: boolean;
}

export interface PatternSuggestionOrchestratorFacts {
    readonly isSplitActive: boolean;
    readonly canUsePattern: boolean;
    readonly hasCategorySelected: boolean;
    readonly hasTagsSelected: boolean;
    readonly hasComment: boolean;
    readonly hasPatternTags: boolean;
    readonly hasPatternComments: boolean;
}
