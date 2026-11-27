import { isDefined } from '@rnw-community/shared';

import { compileRuleRegex } from './compile-rule-regex.util';

export const isValidRulePattern = (pattern: string): boolean => isDefined(compileRuleRegex(pattern));
