import { Text } from 'react-native';

interface Props {
    readonly title: string;
}

const SMALL_TITLE_MAX_FONT_SIZE_MULTIPLIER = 1.2;

export const StackedSmallTitle = ({ title }: Props) => (
    <Text
        className="text-primary text-[17px] leading-[22px] font-semibold text-center"
        numberOfLines={1}
        maxFontSizeMultiplier={SMALL_TITLE_MAX_FONT_SIZE_MULTIPLIER}
    >
        {title}
    </Text>
);
