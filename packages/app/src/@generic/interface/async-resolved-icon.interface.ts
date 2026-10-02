import type { StyledLucideIconType } from '../type/styled-lucide-icon.type';
import type { UserIconNameEnum } from '@budgie/contracts';

export interface AsyncResolvedIconInterface {
    readonly icon: UserIconNameEnum;
    readonly styledIcon: StyledLucideIconType;
}
