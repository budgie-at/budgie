import { isShareEstimated } from './is-share-estimated.util';
import { sumYieldValues } from './sum-yield-values.util';

import type { YieldFactInterface } from '../interface/yield-fact.interface';

export const isYieldEstimated = (facts: readonly Pick<YieldFactInterface, 'isEstimated' | 'value'>[]) =>
    isShareEstimated(sumYieldValues(facts.filter(fact => fact.isEstimated)), sumYieldValues(facts));
