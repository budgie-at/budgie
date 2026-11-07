import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View, useWindowDimensions } from 'react-native';

import { MAX_CHROME_FONT_SIZE_MULTIPLIER } from '../../constant/max-chrome-font-size-multiplier.constant';
import { useIsLargeTextSize } from '../../hook/use-is-large-text-size.hook';
import { Icon } from '../icon/icon';

import type { TextProps } from 'react-native';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly value: string;
    readonly numberOfLines?: number;
    readonly ellipsizeMode?: TextProps['ellipsizeMode'];
}

const ICON_SIZE = 12;

export const ContactSelectorDetail = ({ icon, value, numberOfLines, ellipsizeMode }: Props) => {
    const { fontScale } = useWindowDimensions();
    const isLargeText = useIsLargeTextSize();
    const rowClassName = isLargeText ? 'flex-row items-start gap-x-sm' : 'flex-row items-center gap-x-sm';
    const iconSize = ICON_SIZE * Math.min(fontScale, MAX_CHROME_FONT_SIZE_MULTIPLIER);

    return (
        <View className={rowClassName}>
            <Icon icon={icon} className="text-secondary-foreground" size={iconSize} />
            <Text
                className="flex-1 shrink text-secondary-foreground text-[13px] leading-[18px]"
                maxFontSizeMultiplier={2}
                numberOfLines={numberOfLines}
                ellipsizeMode={ellipsizeMode}
                accessibilityLabel={value}
            >
                {value}
            </Text>
        </View>
    );
};
