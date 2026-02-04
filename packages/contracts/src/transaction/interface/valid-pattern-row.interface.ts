import { UserIconNameEnum } from '../../@generic/enum/user-icon-name.enum';

import { PatternRowInterface } from './pattern-row.interface';

export interface ValidPatternRowInterface extends Omit<PatternRowInterface, 'categoryId' | 'categoryTitle' | 'categoryIcon'> {
    readonly categoryId: number;
    readonly categoryTitle: string;
    readonly categoryIcon: UserIconNameEnum;
}
