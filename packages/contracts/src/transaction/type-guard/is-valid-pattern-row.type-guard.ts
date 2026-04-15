import { isDefined } from '@rnw-community/shared';

import { PatternRowInterface } from '../interface/pattern-row-interface.type';
import { ValidPatternRowInterface } from '../interface/valid-pattern-row-interface.type';

export const isValidPatternRow = (row: PatternRowInterface): row is ValidPatternRowInterface =>
    isDefined(row.categoryId) && isDefined(row.categoryTitle) && isDefined(row.categoryIcon);
