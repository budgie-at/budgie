import { AccountDebtTypeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { AccountSelectorModalSelector } from '../../../app/account-selector-modal.selector';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useDebtAccountProgressSummaryQuery } from '../../query/use-debt-account-progress-summary.query';

const DEBT_TOTAL_LABEL: Record<AccountDebtTypeEnum, MessageDescriptor> = {
    [AccountDebtTypeEnum.LENT]: msg`Total lent`,
    [AccountDebtTypeEnum.BORROW]: msg`Total borrowed`,
    [AccountDebtTypeEnum.INSTALLMENT]: msg`Total`
};

interface Props {
    readonly accountId: number;
    readonly debtType: AccountDebtTypeEnum;
    readonly instrumentSymbol: string;
    readonly targetBalance: number;
    readonly title: string;
}

export const AccountSelectorCardDebtTotalSubtitle = ({ accountId, debtType, instrumentSymbol, targetBalance, title }: Props) => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();
    const summary = useDebtAccountProgressSummaryQuery(accountId);
    const fallbackTotalAmount = convertFromMicroUnits(targetBalance);
    const totalAmount = isDefined(summary) && isPositiveNumber(summary.totalAmount) ? summary.totalAmount : fallbackTotalAmount;
    const debtTotalLabel = t(DEBT_TOTAL_LABEL[debtType]);
    const formattedTotalAmount = formatDigits(totalAmount, instrumentSymbol);
    const debtTotalTestID = AccountSelectorModalSelector.DebtTotal(title, totalAmount);

    return (
        <View className="flex-row items-center">
            <Text className="text-secondary-foreground text-xs flex-shrink" numberOfLines={1}>
                <Trans>Debt</Trans>
            </Text>
            <Text className="text-secondary-foreground text-xs">&nbsp;•&nbsp;</Text>
            <Text className="text-secondary-foreground text-xs flex-shrink" numberOfLines={1}>
                {debtTotalLabel}:&nbsp;
            </Text>
            <ProtectedText className="text-sm font-medium text-primary" numberOfLines={1} testID={debtTotalTestID}>
                {formattedTotalAmount}
            </ProtectedText>
        </View>
    );
};
