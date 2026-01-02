import { UserIconNameEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { typedObjectEntries } from '../utils/typed-object-entries.util';

import { ICONS } from './icons.constant';
import { USER_ICON_TAGS } from './user-icon-tags.constant';

export const USER_ICONS_LIST: UserIcon[] = typedObjectEntries(ICONS).map(([name]) => ({
    name,
    tags: isDefined(USER_ICON_TAGS[name]) ? USER_ICON_TAGS[name] : [name]
}));

export interface UserIcon {
    name: UserIconNameEnum;
    tags: string[];
}
