import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { AccountService } from '../../service/account.service';
import { AccountActionCard } from '../account-action-card/account-action-card';

import { InactiveAccountCardSelector } from './inactive-account-card.selector';

interface Props {
    readonly account: AccountWithInstrumentEntityInterface;
}

export const InactiveAccountCard = ({ account }: Props) => {
    const { t } = useLingui();

    const handleActivate = async () => {
        await appRuntime.runPromise(Effect.flatMap(AccountService, accountService => accountService.activateById(account.id)));
    };

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
            onAction={handleActivate}
            testID={InactiveAccountCardSelector.Card(accountTitle)}
            actionButtonTestID={InactiveAccountCardSelector.ActivateButton(accountTitle)}
        />
    );
};
