export { RuleDetectionModeEnum } from './enum/rule-detection-mode.enum';

export { RuleHost } from './port/rule-host.port';

export { RuleRepository } from './repository/rule.repository';
export { TransactionRuleRepository } from './repository/transaction-rule.repository';

export { RuleEngineService } from './service/rule-engine.service';
export { RuleMatcherService } from './service/rule-matcher.service';
export { RuleService } from './service/rule.service';

export { buildDismissKey } from './util/build-dismiss-key.util';
export { computeDetectionMode } from './util/compute-detection-mode.util';
export { doesRuleMatchTransaction } from './util/does-rule-match-transaction.util';
export { extractRuleActionOutcomes } from './util/extract-rule-action-outcomes.util';
export { hasConflictWithRuleOutcomes } from './util/has-conflict-with-rule-outcomes.util';
export { selectSuggestConditions } from './util/select-suggest-condition.util';

export type { ApplyRuleResultInterface } from './interface/apply-rule-result.interface';
export type { RuleActionOutcomesInterface } from './interface/rule-action-outcomes.interface';
export type { RuleConditionInputInterface } from './interface/rule-condition-input.interface';
export type { RuleEvaluationInputInterface } from './interface/rule-evaluation-input.interface';
export type { SuggestRuleDataInterface } from './interface/suggest-rule-data.interface';
