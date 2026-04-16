import { isDefined } from '@rnw-community/shared';

import { PatternRowInterface } from '../interface/pattern-row.interface';
import { ValidPatternRowInterface } from '../interface/valid-pattern-row.interface';

export const isValidPatternRow = (row: PatternRowInterface): row is ValidPatternRowInterface =>
    isDefined(row.categoryId) && isDefined(row.categoryTitle) && isDefined(row.categoryIcon);
