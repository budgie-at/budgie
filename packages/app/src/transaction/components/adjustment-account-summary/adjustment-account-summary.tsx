import { Trans, useLingui } from '@lingui/react/macro';
import { Text, useWindowDimensions, View } from 'react-native';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { ADJUSTMENT_COMPACT_FONT_SCALE } from '../../constant/adjustment-compact-font-scale.constant';
import { AdjustmentBalanceSummary } from '../adjustment-balance-summary/adjustment-balance-summary';
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
    const isCompact = useWindowDimensions().fontScale >= ADJUSTMENT_COMPACT_FONT_SCALE;
    const sectionClassName = isCompact ? 'gap-y-[8px]' : 'gap-y-[16px]';
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
            <AdjustmentBalanceSummary details={details} amount={amount} isIncrease={isIncrease} />
        </View>
    );
};
