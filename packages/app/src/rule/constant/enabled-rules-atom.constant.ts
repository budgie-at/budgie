import { RuleActionEntityTable, RuleConditionEntityTable, RuleEntityTable, RuleRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

export const enabledRulesAtom = databaseQueryAtom(
    [RuleEntityTable, RuleConditionEntityTable, RuleActionEntityTable],
    Effect.flatMap(RuleRepository, ruleRepository => ruleRepository.findEnabledWithRelations())
);
