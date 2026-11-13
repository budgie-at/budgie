import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/title-max-font-size-multiplier.constant';

interface Props {
    readonly title: string;
    readonly numberOfLines?: number;
}

export const GroupedListSectionTitle = ({ title, numberOfLines }: Props) => (
    <Text
        className="text-secondary-foreground px-3xl pb-md text-[15px] font-semibold"
        accessibilityRole="header"
        numberOfLines={numberOfLines}
        adjustsFontSizeToFit={isDefined(numberOfLines)}
        minimumFontScale={0.8}
        maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
    >
        {title}
    </Text>
);
