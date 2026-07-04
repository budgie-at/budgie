import { AccountDebtTypeEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { AccountSelectorModalSelector } from '../../../app/account-selector-modal.selector';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useDebtAccountProgressSummaryQuery } from '../../query/use-debt-account-progress-summary.query';

interface Props {
    readonly accountId: number;
    readonly debtType: AccountDebtTypeEnum;
    readonly instrumentSymbol: string;
    readonly targetBalance: number;
    readonly title: string;
}

export const AccountSelectorCardDebtTotalSubtitle = ({ accountId, debtType, instrumentSymbol, targetBalance, title }: Props) => {
    const { t } = useLingui();
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const summary = useDebtAccountProgressSummaryQuery(accountId);
    const fallbackTotalAmount = convertFromMicroUnits(targetBalance);
    const totalAmount = isPositiveNumber(summary.totalAmount) ? summary.totalAmount : fallbackTotalAmount;
    const debtTotalLabel = debtType === AccountDebtTypeEnum.BORROW ? t`Total borrowed` : t`Total lent`;
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
