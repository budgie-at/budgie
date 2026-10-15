import type { ReiconIconNameEnum } from '../enum/reicon-icon-name.enum';
import type { UserIconNameEnum } from '../enum/user-icon-name.enum';
import type { EmojiIconType } from './emoji-icon.type';

export type UserIconType = UserIconNameEnum | ReiconIconNameEnum | EmojiIconType;
