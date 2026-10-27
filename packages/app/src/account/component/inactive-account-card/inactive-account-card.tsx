import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { AccountService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { AccountActionButton } from '../account-action-button/account-action-button';
import { AccountActionCard } from '../account-action-card/account-action-card';

import { InactiveAccountCardSelector } from './inactive-account-card.selector';

interface Props {
    readonly account: AccountWithInstrumentEntityInterface;
}

export const InactiveAccountCard = ({ account }: Props) => {
    const { t } = useLingui();
    const { balance } = useAccountBalanceQuery(account.id);

    const accountTitle = account.title;

    const handleActivate = () => {
        Alert.alert(t`Activate Account?`, t`${accountTitle} will be restored to your main view.`, [
            { text: t`Cancel`, style: 'cancel' },
            {
                text: t`Activate`,
                onPress: () =>
                    void appRuntime
                        .runPromise(Effect.flatMap(AccountService, accountService => accountService.activateById(account.id)))
                        .catch(() => {
                            Toast.show({
                                type: 'error',
                                text1: t`Could not activate account.`,
                                text2: t`Something went wrong. Please try again later.`
                            });
                        })
            }
        ]);
    };

    return (
        <AccountActionCard
            account={account}
            balance={balance}
            currencySymbol={account.instrument.symbol}
            testID={InactiveAccountCardSelector.Card(accountTitle)}
        >
            <AccountActionButton
                icon={UserIconNameEnum.Eye}
                onPress={handleActivate}
                testID={InactiveAccountCardSelector.ActivateButton(accountTitle)}
            />
        </AccountActionCard>
    );
};
