import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { TransactionFieldIcon } from '../transaction-field-icon/transaction-field-icon';
import { TransactionFieldIconsSelector } from '../transaction-field-icons/transaction-field-icons.selector';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { EmptyFn } from '@rnw-community/shared';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly splitEntryCount: number;
    readonly isAmountPositive: boolean;
    readonly onPress: EmptyFn;
}

export const TransactionSplitFieldIcon = ({ variant, splitEntryCount, isAmountPositive, onPress }: Props) => {
    const { t } = useLingui();

    const isSplitActive = splitEntryCount > 1;
    const splitValue = isSplitActive
        ? t({
              message: plural(splitEntryCount, {
                  one: '# item',
                  other: '# items'
              })
          })
        : void 0;
    const splitEnabled = isAmountPositive || isSplitActive;

    const splitOpacityStyle = useAnimatedStyle(() => ({
        opacity: withTiming(splitEnabled ? 1 : 0.3, { duration: 200 })
    }));

    const splitPointerEvents = splitEnabled ? 'auto' : 'none';

    return (
        <Animated.View style={splitOpacityStyle} pointerEvents={splitPointerEvents} className="flex-1">
            <TransactionFieldIcon
                icon={UserIconNameEnum.Split}
                label={t`Split`}
                value={splitValue}
                variant={variant}
                onPress={onPress}
                animationDelay={170}
                testID={TransactionFieldIconsSelector.Split}
            />
        </Animated.View>
    );
};
