import { sumNumbers } from './sum-numbers.util';

import type { YieldFactInterface } from '../interface/yield-fact.interface';

export const sumYieldValues = (facts: readonly Pick<YieldFactInterface, 'value'>[]) => sumNumbers(facts.map(fact => fact.value));
