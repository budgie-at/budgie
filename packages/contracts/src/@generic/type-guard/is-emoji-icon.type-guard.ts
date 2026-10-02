import type { EmojiIconType } from '../type/emoji-icon.type';

const EMOJI_ICON_PATTERN =
    /^(?=.*(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20E3))(?:\p{Extended_Pictographic}|\p{Emoji_Component}|\uFE0F|\u200D)+$/u;

export const isEmojiIcon = (icon: string): icon is EmojiIconType => EMOJI_ICON_PATTERN.test(icon);
