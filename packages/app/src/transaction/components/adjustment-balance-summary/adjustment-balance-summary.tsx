import { useLingui } from '@lingui/react/macro';
import { use } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { MoneyText } from '../../../@generic/component/money-text/money-text';
import { MoneyTextVariantEnum } from '../../../@generic/enum/money-text-variant.enum';
import { ADJUSTMENT_COMPACT_FONT_SCALE } from '../../constant/adjustment-compact-font-scale.constant';
import { TransactionKeypadContext } from '../../context/transaction-keypad.context';
import { useAdjustmentBalance } from '../../hook/use-adjustment-balance.hook';
import { AdjustmentSelector } from '../adjustment-account-summary/adjustment-account-summary.selector';
import { AdjustmentBalanceRow } from '../adjustment-balance-row/adjustment-balance-row';

import type { AdjustmentTransactionDetailsInterface } from '../../interface/adjustment-transaction-details.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly details: AdjustmentTransactionDetailsInterface;
    readonly amount: number;
    readonly isIncrease: boolean;
    readonly children: ReactNode;
}

export const AdjustmentBalanceSummary = ({ details, amount, isIncrease, children }: Props) => {
    const { t } = useLingui();
    const { isExpanded } = use(TransactionKeypadContext);
    const { fontScale } = useWindowDimensions();
    const balance = useAdjustmentBalance(details, amount, isIncrease);

    if (isExpanded && fontScale >= ADJUSTMENT_COMPACT_FONT_SCALE) {
        return null;
    }

    const afterContent =
        balance.after === t`Not set` ? (
            <Text className="text-[17px] text-secondary-foreground" maxFontSizeMultiplier={1.35}>
                {balance.after}
            </Text>
        ) : (
            <MoneyText
                amount={balance.resultingBalance}
                instrumentSymbol={details.instrumentSymbol}
                variant={MoneyTextVariantEnum.BALANCE}
                maxFontSizeMultiplier={1.35}
                decimalPlaces={2}
                tone="primary"
            />
        );

    return (
        <>
            <GroupedListSection>
                <AdjustmentBalanceRow label={t`Current adjustment`} value={balance.currentAdjustment} testID={AdjustmentSelector.Original}>
                    <Text className="text-[17px] text-secondary-foreground" maxFontSizeMultiplier={1.35}>
                        {balance.currentAdjustment}
                    </Text>
                </AdjustmentBalanceRow>
                <View className="mx-lg h-hairline bg-surface-separator" />
                <AdjustmentBalanceRow label={t`Current balance`} value={balance.current} testID={AdjustmentSelector.Current}>
                    <Text className="text-[17px] text-secondary-foreground" maxFontSizeMultiplier={1.35}>
                        {balance.current}
                    </Text>
                </AdjustmentBalanceRow>
                <View className="mx-lg h-hairline bg-surface-separator" />
                <AdjustmentBalanceRow
                    label={t`After saving`}
                    accessibilityLabel={t`Balance after saving`}
                    labelClassName="text-[17px] font-semibold text-primary"
                    value={balance.after}
                    testID={AdjustmentSelector.After}
                >
                    {afterContent}
                </AdjustmentBalanceRow>
            </GroupedListSection>
            {children}
        </>
    );
};
