import type { StyledReiconType } from '../type/styled-reicon.type';
import type { UserIconNameEnum } from '@budgie/contracts';

export interface AsyncResolvedIconInterface {
    readonly icon: UserIconNameEnum;
    readonly styledIcon: StyledReiconType;
}
