import { AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HorizontalCell } from '../../../@generic/component/horizontal-cell/horizontal-cell';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { accountBudgetExclusionRepository } from '../../../@generic/drizzle/db/db';
import { ACCOUNT_TYPE } from '../../../account/constant/account-type.constant';
import { useAccountBalanceQuery } from '../../../account/query/use-account-balance.query';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly account: AccountWithInstrumentEntityInterface;
    readonly isExcluded: boolean;
}

export const ExcludedAccountCard = ({ account, isExcluded }: Props) => {
    const { t } = useLingui();

    const { decimalPlaces } = useSettingsContext();
    const { balance } = useAccountBalanceQuery(account.id);

    const formatDigits = useFormatDigits(decimalPlaces);

    const handleToggle = async (isIncluded: boolean) => {
        try {
            if (isIncluded) {
                await accountBudgetExclusionRepository.include(account.id);
            } else {
                await accountBudgetExclusionRepository.exclude(account.id);
            }
        } catch {
            Toast.show({ type: 'error', text1: t`Error`, text2: t`Failed to update account exclusion` });
        }
    };

    return (
        <HorizontalCell
            left={<CircleIcon size={40} iconSize={20} icon={account.icon} variant="ghost" border={false} />}
            right={<ThemedSwitch className="my-auto" value={!isExcluded} onValueChange={handleToggle} />}
        >
            <Text className="text-sm font-medium text-primary" numberOfLines={1}>
                {account.title}
            </Text>
            <View className="flex-row items-center">
                <Text className="text-xs text-secondary-foreground">{t(ACCOUNT_TYPE[account.type])}</Text>
                <Text className="text-xs text-secondary-foreground">&nbsp;•&nbsp;</Text>
                <ProtectedText className="text-xs font-medium text-primary">
                    {formatDigits(balance, account.instrument.symbol)}
                </ProtectedText>
            </View>
        </HorizontalCell>
    );
};
