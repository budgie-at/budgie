import { RuleActionEntityTable, RuleConditionEntityTable, RuleEntityTable, RuleRepository } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const ruleByIdAtom = databaseQueryFamily(
    [RuleEntityTable, RuleConditionEntityTable, RuleActionEntityTable],
    RuleRepository,
    (ruleRepository, id: number) => ruleRepository.findByIdWithRelations(id)
);

export const useGetRuleByIdQuery = (id: number) => {
    const result = useLiveAtomValue(ruleByIdAtom(id));

    return { rule: AsyncResult.getOrElse(result, () => null) ?? null, isLoading: AsyncResult.isInitial(result) };
};
