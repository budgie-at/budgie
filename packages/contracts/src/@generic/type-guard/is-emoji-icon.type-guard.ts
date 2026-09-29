import type { EmojiIconType } from '../type/emoji-icon.type';

export const isEmojiIcon = (icon: string): icon is EmojiIconType => /\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣/u.test(icon);
