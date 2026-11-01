import { useLingui } from '@lingui/react/macro';
import { View, useWindowDimensions } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useScreenChrome, useScreenChromeScrollY } from '@rnw-community/react-native-screen-chrome';
import { isNotEmptyString } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { TRANSACTION_INFO_COMPACT_MAX_FONT_SCALE } from '../../constant/transaction-info-compact-max-font-scale.constant';
import { TRANSACTION_TYPE } from '../../constant/transaction-type.constant';
import { formatTransactionInfoAmount } from '../../utils/format-transaction-info-amount.util';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';
import { TransactionInfoCompactLine } from '../transaction-info-compact-line/transaction-info-compact-line';

import type { TransactionInfoHandoffInterface } from '../../interface/transaction-info-handoff.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly handoff: TransactionInfoHandoffInterface;
    readonly compactTitle?: string;
    readonly compactAmount?: string;
    readonly horizontalInset: number;
}

const Z_INDEX_STYLE = { zIndex: 4 };
const COMPACT_TITLE_LINE_HEIGHT = 21;

export const TransactionInfoNavTitle = (props: Props) => {
    const { transaction, handoff, horizontalInset, compactTitle, compactAmount } = props;
    const { t } = useLingui();
    const { config } = useScreenChrome();
    const { fontScale } = useWindowDimensions();
    const scrollY = useScreenChromeScrollY();
    const formatDigits = useProtectedAmountLabel();
    const titleOffset = (COMPACT_TITLE_LINE_HEIGHT * Math.min(fontScale, TRANSACTION_INFO_COMPACT_MAX_FONT_SCALE)) / 2;
    const centringStyle = useAnimatedStyle(() => {
        const [titleStart, titleEnd] = handoff.compactTitleRange.get();

        return {
            transform: [
                {
                    translateY: interpolate(
                        scrollY.get(),
                        [titleStart, Math.max(titleEnd, titleStart + 1)],
                        [-titleOffset, 0],
                        Extrapolation.CLAMP
                    )
                }
            ]
        };
    });

    const displayTitle = getTransactionDisplayTitle(transaction);
    const title = isNotEmptyString(displayTitle) ? displayTitle : t(TRANSACTION_TYPE[transaction.type]);
    const rowStyle = { height: config.headerHeight };
    const containerStyle = [Z_INDEX_STYLE, { paddingHorizontal: horizontalInset }];

    return (
        <View
            className="absolute inset-x-0 top-0 pt-safe"
            style={containerStyle}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <View className="justify-center" style={rowStyle}>
                <Animated.View style={centringStyle}>
                    <TransactionInfoCompactLine range={handoff.compactTitleRange} className="text-[17px] leading-[21px]">
                        {compactTitle ?? title}
                    </TransactionInfoCompactLine>
                    <TransactionInfoCompactLine range={handoff.compactAmountRange} className="text-[15px] leading-[19px] tabular-nums">
                        {compactAmount ?? formatTransactionInfoAmount(transaction, formatDigits)}
                    </TransactionInfoCompactLine>
                </Animated.View>
            </View>
        </View>
    );
};
