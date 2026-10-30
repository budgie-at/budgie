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
    readonly revealRange: readonly [number, number];
    readonly compactTitle?: string;
    readonly compactAmount?: string;
    readonly horizontalInset: number;
}

const Z_INDEX_STYLE = { zIndex: 4 };
const COMPACT_TITLE_MAX_FONT_SCALE = 1.1;

export const TransactionInfoNavTitle = (props: Props) => {
    const { transaction, revealRange, horizontalInset, compactTitle, compactAmount } = props;
    const { t } = useLingui();
    const { config } = useScreenChrome();
    const scrollY = useScreenChromeScrollY();
    const formatDigits = useProtectedAmountLabel();
    const [revealStart, revealEnd] = revealRange;

    const displayTitle = getTransactionDisplayTitle(transaction);
    const title = isNotEmptyString(displayTitle) ? displayTitle : t(TRANSACTION_TYPE[transaction.type]);
    const rowStyle = { height: config.headerHeight };
    const animatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.get(), [revealStart, Math.max(revealEnd, revealStart + 1)], [0, 1], Extrapolation.CLAMP)
    }));
    const titleStyle = [rowStyle, animatedStyle];
    const containerStyle = [Z_INDEX_STYLE, { paddingHorizontal: horizontalInset }];

    return (
        <View
            className="absolute inset-x-0 top-0 pt-safe"
            style={containerStyle}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <Animated.View className="items-center justify-center" style={titleStyle}>
                <Text
                    maxFontSizeMultiplier={COMPACT_TITLE_MAX_FONT_SCALE}
                    className="self-stretch text-[17px] leading-[21px] text-primary font-semibold text-center"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {compactTitle ?? title}
                </Text>
                <Text
                    maxFontSizeMultiplier={COMPACT_TITLE_MAX_FONT_SCALE}
                    className="self-stretch text-[12px] leading-[15px] text-transaction-detail-secondary text-center tabular-nums"
                    numberOfLines={1}
                >
                    {compactAmount ?? formatTransactionInfoAmount(transaction, formatDigits)}
                </Text>
            </Animated.View>
        </View>
    );
};
