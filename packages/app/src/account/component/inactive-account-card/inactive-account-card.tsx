import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { AccountService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

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

    return (
        <AccountActionCard
            account={account}
            balance={balance}
            currencySymbol={account.instrument.symbol}
            testID={InactiveAccountCardSelector.Card(accountTitle)}
        >
            <AccountActionButton
                icon={UserIconNameEnum.Eye}
                actionButtonText={t`Activate`}
                confirmTitle={t`Activate Account?`}
                confirmDescription={t`${accountTitle} will be restored to your main view.`}
                errorText={t`Could not activate account.`}
                onAction={Effect.flatMap(AccountService, accountService => accountService.activateById(account.id))}
                testID={InactiveAccountCardSelector.ActivateButton(accountTitle)}
            />
        </AccountActionCard>
    );
};
