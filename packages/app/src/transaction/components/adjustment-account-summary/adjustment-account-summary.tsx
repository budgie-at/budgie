import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
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

export const AdjustmentAccountSummary = ({ details, amount, isIncrease }: Props) => {
    const { t } = useLingui();
    const accountAccessibilityLabel = `${t`Account`}, ${details.accountTitle}, ${details.instrumentCode}`;

    const pressableProps = { accessibilityLabel: accountAccessibilityLabel };

    return (
        <View className="gap-y-[12px] pt-[12px]" testID={AdjustmentSelector.Summary}>
            <GroupedListSection>
                <TransactionFormRow
                    left={<TransactionFormIcon icon={details.accountIcon} />}
                    label={t`Account`}
                    value={details.accountTitle}
                    pressableProps={pressableProps}
                    right={
                        <Text className="text-[17px] text-secondary-foreground" maxFontSizeMultiplier={1.6}>
                            {details.instrumentCode}
                        </Text>
                    }
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
