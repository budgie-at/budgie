import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { AccountArchiveService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

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
                    actionButtonText={t`Restore`}
                    confirmTitle={t`Restore Account?`}
                    confirmDescription={t`${accountTitle} will be restored to your main view and included in totals.`}
                    errorText={t`Could not restore account.`}
                    onAction={Effect.flatMap(AccountArchiveService, accountArchiveService => accountArchiveService.restoreById(account.id))}
                    testID={ArchivedAccountCardSelector.RestoreButton(accountTitle)}
                />
            )}
        </AccountActionCard>
    );
};
