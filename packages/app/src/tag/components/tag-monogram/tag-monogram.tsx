import { Text, View } from 'react-native';

const LEADING_EMOJI_PATTERN =
    /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|\p{Emoji_Modifier}|️|‍|⃣)*/u;

interface Props {
    readonly title: string;
}

export const TagMonogram = ({ title }: Props) => {
    const trimmedTitle = title.trim();
    const leadingEmoji = LEADING_EMOJI_PATTERN.exec(trimmedTitle)?.[0];
    const monogram = leadingEmoji ?? Array.from(trimmedTitle).at(0)?.toLocaleUpperCase() ?? '#';

    return (
        <View
            className="size-[36px] items-center justify-center rounded-full bg-surface-disc"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <Text className="text-secondary-foreground text-[16px] font-semibold" maxFontSizeMultiplier={1.3}>
                {monogram}
            </Text>
        </View>
    );
};
