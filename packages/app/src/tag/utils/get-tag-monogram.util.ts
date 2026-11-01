const LEADING_EMOJI_PATTERN =
    /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|\p{Emoji_Modifier}|️|‍|⃣)*/u;

export const getTagMonogram = (title: string): string => {
    const trimmedTitle = title.trim();
    const leadingEmoji = LEADING_EMOJI_PATTERN.exec(trimmedTitle)?.[0];

    return leadingEmoji ?? Array.from(trimmedTitle).at(0)?.toLocaleUpperCase() ?? '#';
};
