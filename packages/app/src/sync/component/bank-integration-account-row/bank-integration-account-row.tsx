import { AccountAssociationEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { SyncProviderRegistryService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { testID } from '../../../@generic/utils/test-id.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { AccountCardBaseSelector } from '../../../account/component/account-card-base/account-card-base.selector';
import { AccountSyncBadge } from '../../../account/component/account-sync-badge/account-sync-badge';
import { useAccountBalanceQuery } from '../../../account/query/use-account-balance.query';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useBankIntegrationAccountRowState } from '../../hook/use-bank-integration-account-row-state.hook';
import { BankIntegrationAccountMenu } from '../bank-integration-account-menu/bank-integration-account-menu';

interface Props {
    readonly account: Pick<
        AccountWithInstrumentEntityInterface,
        'id' | 'title' | 'icon' | 'isActive' | 'iban' | AccountAssociationEnum.INSTRUMENT
    >;
}

export const BankIntegrationAccountRow = ({ account }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const { balance } = useAccountBalanceQuery(account.id);
    const formatDigits = useDisplayFormatDigits();
    const { sync, syncState, switchLabel, description, isToggleVisible } = useBankIntegrationAccountRowState(account);

    const rowTestID = BankIntegrationSelector.AccountRow(account.id);
    const handleToggle = (enabled: boolean) =>
        void appRuntime.runFork(
            logAndContinue(
                Effect.flatMap(SyncProviderRegistryService, registry => registry.setAccountSyncEnabled(account.id, enabled)).pipe(
                    toastOnFailure(t`Could not update setting`)
                )
            )
        );
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
            left={
                <View className="relative">
                    <CircleIcon icon={account.icon} variant="ghost" size={46} iconSize={20} border={false} />
                    {isDefined(syncState) ? <AccountSyncBadge state={syncState} /> : null}
                </View>
            }
            title={account.title}
            description={description}
            right={
                <View className="flex-row items-center gap-x-lg">
                    <ProtectedText
                        className="text-primary text-sm font-semibold"
                        testID={AccountCardBaseSelector.Balance(account.title, formatDigits(balance))}
                    >
                        {formatDigits(balance, account.instrument.symbol)}
                    </ProtectedText>

                    {toggle}

                    <BankIntegrationAccountMenu accountId={account.id} rowTestID={rowTestID} />
                </View>
            }
        />
    );
};
