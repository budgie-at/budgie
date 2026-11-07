import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { MoneyText } from '../../../@generic/component/money-text/money-text';
import { MoneyTextVariantEnum } from '../../../@generic/enum/money-text-variant.enum';
import { useAccountBalanceQuery } from '../../../account/query/use-account-balance.query';
import { TransactionFormIcon } from '../transaction-form-icon/transaction-form-icon';

import type { AdjustmentTransactionDetailsInterface } from '../../interface/adjustment-transaction-details.interface';

interface Props {
    readonly details: AdjustmentTransactionDetailsInterface;
    readonly amount: number;
    readonly isIncrease: boolean;
}

export const AdjustmentAccountSummary = ({ details, amount, isIncrease }: Props) => {
    const { balance } = useAccountBalanceQuery(details.accountId);
    const resultingBalance =
        balance - (details.initialIsIncrease ? details.initialAmount : -details.initialAmount) + (isIncrease ? amount : -amount);

    return (
        <View className="gap-y-[24px]">
            <GroupedListSection>
                <GroupedListRow
                    left={<TransactionFormIcon icon={details.accountIcon} />}
                    title={
                        <Text className="text-[17px] text-primary" maxFontSizeMultiplier={1.75} numberOfLines={2}>
                            {details.accountTitle}
                        </Text>
                    }
                    subtitle={
                        <Text className="text-[13px] text-secondary-foreground" maxFontSizeMultiplier={1.6}>
                            <Trans>Account</Trans>
                        </Text>
                    }
                    right={
                        <Text className="text-[13px] text-secondary-foreground" maxFontSizeMultiplier={1.3}>
                            {details.instrumentCode}
                        </Text>
                    }
                />
            </GroupedListSection>
            <GroupedListSection
                footer={
                    <Text className="px-3xl pt-md text-[13px] leading-[18px] text-secondary-foreground" maxFontSizeMultiplier={1.6}>
                        <Trans>The updated adjustment replaces the original amount in your balance.</Trans>
                    </Text>
                }
            >
                <GroupedListRow
                    title={
                        <Text className="text-[17px] text-primary" maxFontSizeMultiplier={1.6}>
                            <Trans>Current balance</Trans>
                        </Text>
                    }
                    subtitle={<MoneyText amount={balance} instrumentSymbol={details.instrumentSymbol} variant={MoneyTextVariantEnum.ROW} />}
                />
                <GroupedListRow
                    title={
                        <Text className="text-[17px] text-primary" maxFontSizeMultiplier={1.6}>
                            <Trans>Balance after saving</Trans>
                        </Text>
                    }
                    subtitle={
                        <MoneyText
                            amount={resultingBalance}
                            instrumentSymbol={details.instrumentSymbol}
                            variant={MoneyTextVariantEnum.ROW}
                        />
                    }
                />
            </GroupedListSection>
        </View>
    );
};
