import { Text } from 'react-native';

import { MAX_FONT_SIZE_MULTIPLIER } from '../../constant/max-font-size-multiplier.constant';

interface Props {
    readonly label: string;
}

export const SectionHeader = ({ label }: Props) => (
    <Text
        accessibilityRole="header"
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        className="mt-8xl pt-xl pb-xl text-md font-semibold text-primary"
    >
        {label}
    </Text>
);
