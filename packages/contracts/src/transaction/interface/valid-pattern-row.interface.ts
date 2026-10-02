import { PatternRowInterface } from './pattern-row.interface';

import type { UserIconType } from '../../@generic/type/user-icon.type';

export interface ValidPatternRowInterface extends Omit<PatternRowInterface, 'categoryId' | 'categoryTitle' | 'categoryIcon'> {
    readonly categoryId: number;
    readonly categoryTitle: string;
    readonly categoryIcon: UserIconType;
}
