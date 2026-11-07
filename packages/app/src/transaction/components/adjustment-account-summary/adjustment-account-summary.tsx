import { Trans, useLingui } from '@lingui/react/macro';
import { Text, useWindowDimensions, View } from 'react-native';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { MoneyText } from '../../../@generic/component/money-text/money-text';
import { MoneyTextVariantEnum } from '../../../@generic/enum/money-text-variant.enum';
import { ADJUSTMENT_COMPACT_FONT_SCALE } from '../../constant/adjustment-compact-font-scale.constant';
import { useAdjustmentBalance } from '../../hook/use-adjustment-balance.hook';
import { AdjustmentBalanceRow } from '../adjustment-balance-row/adjustment-balance-row';
import { TransactionFormIcon } from '../transaction-form-icon/transaction-form-icon';

import { AdjustmentSelector } from './adjustment-account-summary.selector';

import type { AdjustmentTransactionDetailsInterface } from '../../interface/adjustment-transaction-details.interface';

interface Props {
    readonly details: AdjustmentTransactionDetailsInterface;
    readonly amount: number;
    readonly isIncrease: boolean;
}

export const AdjustmentAccountSummary = ({ details, amount, isIncrease }: Props) => {
    const { t } = useLingui();
    const balance = useAdjustmentBalance(details, amount, isIncrease);
    const isCompact = useWindowDimensions().fontScale >= ADJUSTMENT_COMPACT_FONT_SCALE;
    const sectionClassName = isCompact ? 'gap-y-[8px]' : 'gap-y-[16px]';
    const changeClassName = balance.change < 0 ? 'text-[13px] text-destructive-foreground' : 'text-[13px] text-positive-strong';
    const detailClassName = balance.change === 0 ? 'text-[13px] text-secondary-foreground' : changeClassName;
    const detail = balance.change === 0 || balance.after === '—' ? null : balance.difference;
    const afterValue = balance.change === 0 ? t`No change` : balance.after;
    const afterContent =
        balance.after === '—' || balance.change === 0 ? (
            <Text className="text-[17px] font-semibold text-primary" maxFontSizeMultiplier={1.35}>
                {afterValue}
            </Text>
        ) : (
            <MoneyText
                amount={balance.resultingBalance}
                instrumentSymbol={details.instrumentSymbol}
                variant={MoneyTextVariantEnum.ROW}
                maxFontSizeMultiplier={1.35}
                decimalPlaces={2}
                tone="primary"
            />
        );
    const accountAccessibilityLabel = `${t`Account`}, ${details.accountTitle}, ${details.instrumentCode}`;

    return (
        <View className={sectionClassName} testID={AdjustmentSelector.Summary}>
            <GroupedListSection>
                <View
                    accessible
                    accessibilityLabel={accountAccessibilityLabel}
                    className="min-h-[44px] flex-row items-center gap-x-md px-lg py-[6px]"
                >
                    <TransactionFormIcon icon={details.accountIcon} />
                    <View className="min-w-0 flex-1 flex-row items-center gap-x-md">
                        <Text className="text-[15px] text-secondary-foreground" maxFontSizeMultiplier={1.3}>
                            <Trans>Account</Trans>
                        </Text>
                        <Text
                            className="min-w-0 flex-1 text-right text-[17px] font-medium text-primary"
                            maxFontSizeMultiplier={1.35}
                            numberOfLines={2}
                        >
                            {details.accountTitle}
                        </Text>
                    </View>
                    <Text className="text-[13px] text-secondary-foreground" maxFontSizeMultiplier={1.3}>
                        {details.instrumentCode}
                    </Text>
                </View>
            </GroupedListSection>
            <GroupedListSection>
                <AdjustmentBalanceRow label={t`Current balance`} value={balance.current} testID={AdjustmentSelector.Current}>
                    <MoneyText
                        amount={balance.balance}
                        instrumentSymbol={details.instrumentSymbol}
                        variant={MoneyTextVariantEnum.ROW}
                        maxFontSizeMultiplier={1.35}
                        decimalPlaces={2}
                        tone="secondary"
                    />
                </AdjustmentBalanceRow>
                <View className="mx-lg h-hairline bg-surface-separator" />
                <AdjustmentBalanceRow
                    label={t`After saving`}
                    labelClassName="text-[17px] font-semibold text-primary"
                    value={afterValue}
                    detail={detail}
                    detailClassName={detailClassName}
                    testID={AdjustmentSelector.After}
                >
                    {afterContent}
                </AdjustmentBalanceRow>
            </GroupedListSection>
            <View accessible accessibilityLabel={`${balance.currentAdjustment}. ${balance.replacement}`} className="gap-y-[2px] px-lg">
                <Text className="text-[13px] text-secondary-foreground" maxFontSizeMultiplier={1.3}>
                    {balance.currentAdjustment}
                </Text>
                <Text className="text-[13px] text-secondary-foreground" maxFontSizeMultiplier={1.3}>
                    {balance.replacement}
                </Text>
            </View>
        </View>
    );
};
