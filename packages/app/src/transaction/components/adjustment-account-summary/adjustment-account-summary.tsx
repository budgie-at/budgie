import { useLingui } from '@lingui/react/macro';
import { use } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { ADJUSTMENT_COMPACT_FONT_SCALE } from '../../constant/adjustment-compact-font-scale.constant';
import { TransactionKeypadContext } from '../../context/transaction-keypad.context';
import { AdjustmentBalanceSummary } from '../adjustment-balance-summary/adjustment-balance-summary';
import { TransactionFormIcon } from '../transaction-form-icon/transaction-form-icon';
import { TransactionFormRow } from '../transaction-form-row/transaction-form-row';
import { TransactionNoteFieldIcon } from '../transaction-note-field-icon/transaction-note-field-icon';

import { AdjustmentSelector } from './adjustment-account-summary.selector';

import type { AdjustmentTransactionDetailsInterface } from '../../interface/adjustment-transaction-details.interface';

interface Props {
    readonly details: AdjustmentTransactionDetailsInterface;
    readonly amount: number;
    readonly isIncrease: boolean;
}

const COMPACT_ACCOUNT_STYLE = { paddingVertical: 4 };

export const AdjustmentAccountSummary = ({ details, amount, isIncrease }: Props) => {
    const { t } = useLingui();
    const { isExpanded } = use(TransactionKeypadContext);
    const isCompact = useWindowDimensions().fontScale >= ADJUSTMENT_COMPACT_FONT_SCALE;
    const isCompactExpanded = isExpanded && isCompact;
    const valueProps = { testID: AdjustmentSelector.AccountValue, ...(isCompactExpanded && { numberOfLines: 1 }) };
    const trailingCurrency = isCompact ? (
        <Text className="text-[17px] text-secondary-foreground" maxFontSizeMultiplier={1.6}>
            {details.instrumentCode}
        </Text>
    ) : null;
    const accountAccessibilityLabel = `${t`Account`}, ${details.accountTitle}, ${details.instrumentCode}`;

    const pressableProps = { accessibilityLabel: accountAccessibilityLabel, ...(isCompactExpanded && { style: COMPACT_ACCOUNT_STYLE }) };

    return (
        <View className="gap-y-[12px] pt-[12px]" testID={AdjustmentSelector.Summary}>
            <GroupedListSection>
                <TransactionFormRow
                    left={<TransactionFormIcon icon={details.accountIcon} />}
                    label={t`Account`}
                    value={details.accountTitle}
                    valueProps={valueProps}
                    testID={AdjustmentSelector.Account}
                    pressableProps={pressableProps}
                    right={trailingCurrency}
                />
            </GroupedListSection>
            <AdjustmentBalanceSummary details={details} amount={amount} isIncrease={isIncrease}>
                <GroupedListSection>
                    <TransactionNoteFieldIcon />
                </GroupedListSection>
            </AdjustmentBalanceSummary>
        </View>
    );
};
