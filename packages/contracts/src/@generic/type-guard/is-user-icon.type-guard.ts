import { UserIconNameEnum } from '../enum/user-icon-name.enum';

import { isEmojiIcon } from './is-emoji-icon.type-guard';

import type { UserIconType } from '../type/user-icon.type';

const USER_ICON_NAMES = new Set<string>(Object.values(UserIconNameEnum));

export const isUserIcon = (icon: string): icon is UserIconType => USER_ICON_NAMES.has(icon) || isEmojiIcon(icon);
