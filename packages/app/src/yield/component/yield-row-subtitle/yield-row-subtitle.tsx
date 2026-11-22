import { Text } from 'react-native';

import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';

interface Props {
    readonly subtitle: string;
}

export const YieldRowSubtitle = ({ subtitle }: Props) => (
    <Text
        className="text-[13px] leading-[18px] text-secondary-foreground"
        numberOfLines={1}
        maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
    >
        {subtitle}
    </Text>
);
