import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { AccountArchiveService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { useArchivedAccountBalanceQuery } from '../../query/use-archived-account-balance.query';
import { AccountActionButton } from '../account-action-button/account-action-button';
import { AccountActionCard } from '../account-action-card/account-action-card';

import { ArchivedAccountCardSelector } from './archived-account-card.selector';

interface Props {
    readonly account: AccountWithInstrumentEntityInterface;
}

export const ArchivedAccountCard = ({ account }: Props) => {
    const { t } = useLingui();
    const { balance } = useArchivedAccountBalanceQuery(account.id);

    const accountTitle = account.title;

    const handleRestore = () => {
        Alert.alert(t`Restore Account?`, t`${accountTitle} will be restored to your main view and included in totals.`, [
            { text: t`Cancel`, style: 'cancel' },
            {
                text: t`Restore`,
                onPress: () =>
                    void appRuntime
                        .runPromise(
                            Effect.flatMap(AccountArchiveService, accountArchiveService => accountArchiveService.restoreById(account.id))
                        )
                        .catch(() => {
                            Toast.show({
                                type: 'error',
                                text1: t`Could not restore account.`,
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
            testID={ArchivedAccountCardSelector.Card(accountTitle)}
        >
            {!account.isExternal && (
                <AccountActionButton
                    icon={UserIconNameEnum.RotateCcw}
                    onPress={handleRestore}
                    testID={ArchivedAccountCardSelector.RestoreButton(accountTitle)}
                />
            )}
        </AccountActionCard>
    );
};
