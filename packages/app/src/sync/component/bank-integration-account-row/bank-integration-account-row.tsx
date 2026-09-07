import { AccountAssociationEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { testID } from '../../../@generic/utils/test-id.util';
import { useAccountBalanceQuery } from '../../../account/query/use-account-balance.query';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useBankIntegrationAccountRowState } from '../../hook/use-bank-integration-account-row-state.hook';
import { syncProviderRegistryService } from '../../service/sync-provider-registry.service';
import { BankIntegrationAccountMenu } from '../bank-integration-account-menu/bank-integration-account-menu';

interface Props {
    readonly account: Pick<AccountWithInstrumentEntityInterface, 'id' | 'title' | 'icon' | 'isActive' | AccountAssociationEnum.INSTRUMENT>;
}

export const BankIntegrationAccountRow = ({ account }: Props) => {
    const router = useRouter();
    const { balance } = useAccountBalanceQuery(account.id);
    const formatDigits = useDisplayFormatDigits();
    const { sync, switchLabel, description, isToggleVisible } = useBankIntegrationAccountRowState(account);

    const rowTestID = BankIntegrationSelector.AccountRow(account.id);
    const handleToggle = (enabled: boolean) =>
        void syncProviderRegistryService
            .getServiceForAccount(account.id)
            .then(service => service?.setAccountSyncEnabled(account.id, enabled));
    const handlePress = () => void router.push({ pathname: '/account/[id]/update', params: { id: String(account.id) } });

    const toggle = isToggleVisible ? (
        <ThemedSwitch
            value={sync?.enabled ?? false}
            onValueChange={handleToggle}
            accessibilityLabel={switchLabel}
            {...testID(rowTestID, TestIDPartEnum.TOGGLE)}
        />
    ) : null;

    return (
        <SimpleHorizontalCell
            testID={rowTestID}
            singleLine
            onPress={handlePress}
            accessible={false}
            onTitlePress={handlePress}
            left={<CircleIcon icon={account.icon} variant="ghost" size={46} iconSize={20} border={false} />}
            title={account.title}
            description={description}
            right={
                <View className="flex-row items-center gap-x-lg">
                    <ProtectedText className="text-primary text-sm font-semibold">
                        {formatDigits(balance, account.instrument.symbol)}
                    </ProtectedText>

                    {toggle}

                    <BankIntegrationAccountMenu accountId={account.id} rowTestID={rowTestID} />
                </View>
            }
        />
    );
};
