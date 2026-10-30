import { useLingui } from '@lingui/react/macro';
import { View, useWindowDimensions } from 'react-native';

import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';
import { isNotEmptyString } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { TRANSACTION_INFO_STACKED_FONT_SCALE } from '../../constant/transaction-info-stacked-font-scale.constant';
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

export const TransactionInfoNavTitle = (props: Props) => {
    const { transaction, handoff, horizontalInset, compactTitle, compactAmount } = props;
    const { t } = useLingui();
    const { config } = useScreenChrome();
    const { fontScale } = useWindowDimensions();
    const formatDigits = useProtectedAmountLabel();
    const largeText = fontScale > TRANSACTION_INFO_STACKED_FONT_SCALE;

    const displayTitle = getTransactionDisplayTitle(transaction);
    const title = isNotEmptyString(displayTitle) ? displayTitle : t(TRANSACTION_TYPE[transaction.type]);
    const rowStyle = { height: config.headerHeight };
    const containerStyle = [Z_INDEX_STYLE, { paddingHorizontal: horizontalInset }];
    const titleClassName = largeText
        ? 'text-[15px] leading-[20px] text-primary font-semibold'
        : 'text-[17px] leading-[21px] text-primary font-semibold';
    const amountClassName = largeText
        ? 'text-[20px] leading-[25px] text-primary font-semibold tabular-nums'
        : 'text-[15px] leading-[19px] text-primary font-semibold tabular-nums';
    const titleLines = largeText ? 2 : 1;

    return (
        <View
            className="absolute inset-x-0 top-0 pt-safe"
            style={containerStyle}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <View className="items-center justify-center" style={rowStyle}>
                <TransactionInfoCompactLine range={handoff.compactTitleRange} className={titleClassName} numberOfLines={titleLines}>
                    {compactTitle ?? title}
                </TransactionInfoCompactLine>
                <TransactionInfoCompactLine range={handoff.compactAmountRange} className={amountClassName} numberOfLines={1}>
                    {compactAmount ?? formatTransactionInfoAmount(transaction, formatDigits)}
                </TransactionInfoCompactLine>
            </View>
        </View>
    );
};
