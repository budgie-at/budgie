import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { AccountService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { AccountActionCard } from '../account-action-card/account-action-card';

import { InactiveAccountCardSelector } from './inactive-account-card.selector';

interface Props {
    readonly account: AccountWithInstrumentEntityInterface;
}

export const InactiveAccountCard = ({ account }: Props) => {
    const { t } = useLingui();

    const accountTitle = account.title;

    return (
        <AccountActionCard
            account={account}
            actionIcon={UserIconNameEnum.Eye}
            actionButtonText={t`Activate`}
            confirmTitle={t`Activate Account?`}
            confirmDescription={t`${accountTitle} will be restored to your main view.`}
            errorText={t`Could not activate account.`}
            currencySymbol={account.instrument.symbol}
            onAction={Effect.flatMap(AccountService, accountService => accountService.activateById(account.id))}
            testID={InactiveAccountCardSelector.Card(accountTitle)}
            actionButtonTestID={InactiveAccountCardSelector.ActivateButton(accountTitle)}
        />
    );
};
