import { typedObjectEntries } from '../utils/typed-object-entries.util';

import { ICONS, IconName } from './icons.constant';

export const USER_ICONS_LIST: UserIcon[] = typedObjectEntries(ICONS).map(([name]) => ({ name }));

export interface UserIcon {
    name: UserIconNameEnum;
}
