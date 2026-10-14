export { RuleDetectionModeEnum } from './enum/rule-detection-mode.enum';

export { RuleSuggestionDuplicateError } from './error/rule-suggestion-duplicate.error';

export { RuleRepository } from './repository/rule.repository';
export { TransactionRuleRepository } from './repository/transaction-rule.repository';

export { RuleEngineService } from './service/rule-engine.service';
export { RuleMatcherService } from './service/rule-matcher.service';
export { RuleService } from './service/rule.service';

export { buildCategoryTagActions } from './utils/build-category-tag-actions.util';
export { buildDismissKey } from './utils/build-dismiss-key.util';
export { computeDetectionMode } from './utils/compute-detection-mode.util';
export { detectRuleChanges } from './utils/detect-rule-changes.util';
export { doesRuleMatchTransaction } from './utils/does-rule-match-transaction.util';
export { extractRuleActionOutcomes } from './utils/extract-rule-action-outcomes.util';
export { hasConflictWithRuleOutcomes } from './utils/has-conflict-with-rule-outcomes.util';
export { selectSuggestConditions } from './utils/select-suggest-condition.util';

export type { ApplyRuleResultInterface } from './interface/apply-rule-result.interface';
export type { RuleChangesInterface } from './interface/rule-changes.interface';
export type { RuleActionOutcomesInterface } from './interface/rule-action-outcomes.interface';
export type { RuleConditionInputInterface } from './interface/rule-condition-input.interface';
export type { RuleEvaluationInputInterface } from './interface/rule-evaluation-input.interface';
export type { SuggestRuleDataInterface } from './interface/suggest-rule-data.interface';
