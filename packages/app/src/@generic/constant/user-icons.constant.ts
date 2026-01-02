import { UserIconNameEnum } from '@budgie/contracts';

import { typedObjectEntries } from '../utils/typed-object-entries.util';

import { ICONS } from './icons.constant';

export const USER_ICONS_LIST: UserIcon[] = typedObjectEntries(ICONS).map(([name]) => ({ name }));

export interface UserIcon {
    name: UserIconNameEnum;
}
