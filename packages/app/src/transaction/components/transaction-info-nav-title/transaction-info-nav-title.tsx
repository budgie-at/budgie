import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useScreenChrome, useScreenChromeScrollY } from '@rnw-community/react-native-screen-chrome';
import { isNotEmptyString } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { TRANSACTION_INFO_HANDOFF_DISTANCE } from '../../constant/transaction-info-handoff-distance.constant';
import { TRANSACTION_TYPE } from '../../constant/transaction-type.constant';
import { formatTransactionInfoAmount } from '../../utils/format-transaction-info-amount.util';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { TextLayoutEvent } from 'react-native';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly revealOffset: number;
    readonly compactTitle?: string;
    readonly compactAmount?: string;
    readonly horizontalInset: number;
}

const Z_INDEX_STYLE = { zIndex: 4 };

export const TransactionInfoNavTitle = (props: Props) => {
    const { transaction, revealOffset, horizontalInset, compactTitle, compactAmount } = props;
    const { t } = useLingui();
    const { config } = useScreenChrome();
    const scrollY = useScreenChromeScrollY();
    const formatDigits = useProtectedAmountLabel();
    const [titleFits, setTitleFits] = useState(true);

    const displayTitle = getTransactionDisplayTitle(transaction);
    const title = isNotEmptyString(displayTitle) ? displayTitle : t(TRANSACTION_TYPE[transaction.type]);
    const rowStyle = { height: config.headerHeight };
    const animatedStyle = useAnimatedStyle(() => {
        const progress = interpolate(
            scrollY.get(),
            [revealOffset - TRANSACTION_INFO_HANDOFF_DISTANCE, revealOffset + TRANSACTION_INFO_HANDOFF_DISTANCE],
            [0, 1],
            Extrapolation.CLAMP
        );

        return { opacity: progress };
    });
    const titleStyle = [rowStyle, animatedStyle];
    const compactTitleText = compactTitle ?? title;
    const handleMeasureLayout = (event: TextLayoutEvent) => void setTitleFits(event.nativeEvent.lines.length <= 1);
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
                    maxFontSizeMultiplier={1.35}
                    className="absolute inset-x-0 text-[17px] leading-[22px] font-semibold text-center opacity-0"
                    onTextLayout={handleMeasureLayout}
                >
                    {compactTitleText}
                </Text>
                <Text
                    maxFontSizeMultiplier={1.35}
                    className="text-[17px] leading-[22px] text-primary font-semibold text-center"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {compactTitleText}
                </Text>
                {titleFits ? (
                    <Text
                        maxFontSizeMultiplier={1.35}
                        className="text-[13px] leading-[16px] text-secondary-foreground text-center tabular-nums"
                        numberOfLines={1}
                    >
                        {compactAmount ?? formatTransactionInfoAmount(transaction, formatDigits)}
                    </Text>
                ) : null}
            </Animated.View>
        </View>
    );
};
