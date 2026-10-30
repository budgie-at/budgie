import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useScreenChrome, useScreenChromeScrollY } from '@rnw-community/react-native-screen-chrome';
import { isNotEmptyString } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { TRANSACTION_TYPE } from '../../constant/transaction-type.constant';
import { formatTransactionInfoAmount } from '../../utils/format-transaction-info-amount.util';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly revealOffset: number;
}

const REVEAL_DISTANCE = 20;
const Z_INDEX_STYLE = { zIndex: 4 };

export const TransactionInfoNavTitle = ({ transaction, revealOffset }: Props) => {
    const { t } = useLingui();
    const { config } = useScreenChrome();
    const scrollY = useScreenChromeScrollY();
    const formatDigits = useProtectedAmountLabel();

    const displayTitle = getTransactionDisplayTitle(transaction);
    const title = isNotEmptyString(displayTitle) ? displayTitle : t(TRANSACTION_TYPE[transaction.type]);
    const rowStyle = { height: config.headerHeight };
    const animatedStyle = useAnimatedStyle(() => {
        const progress = interpolate(scrollY.get(), [revealOffset, revealOffset + REVEAL_DISTANCE], [0, 1], Extrapolation.CLAMP);

        return { opacity: progress };
    });
    const titleStyle = [rowStyle, animatedStyle];

    return (
        <View
            className="absolute inset-x-0 top-0 pt-safe pl-[60px] pr-[116px]"
            style={Z_INDEX_STYLE}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <Animated.View className="items-center justify-center" style={titleStyle}>
                {isNotEmptyString(title) ? (
                    <Text
                        maxFontSizeMultiplier={1.35}
                        className="text-[17px] leading-[22px] text-primary font-semibold text-center"
                        numberOfLines={1}
                    >
                        {title}
                    </Text>
                ) : null}
                <Text
                    maxFontSizeMultiplier={1.35}
                    className="text-[13px] leading-[16px] text-secondary-foreground text-center tabular-nums"
                    numberOfLines={1}
                >
                    {formatTransactionInfoAmount(transaction, formatDigits)}
                </Text>
            </Animated.View>
        </View>
    );
};
