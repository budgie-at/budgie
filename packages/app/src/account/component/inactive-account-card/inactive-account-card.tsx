import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { InactiveAccountCardSelectors } from '../../../@e2e/selectors/inactive-account-card.selector';
import { accountService } from '../../service/account.service';
import { AccountActionCard } from '../account-action-card/account-action-card';

interface Props {
    readonly account: AccountWithInstrumentEntityInterface;
}

export const InactiveAccountCard = ({ account }: Props) => {
    const { t } = useLingui();

    const handleActivate = async () => {
        await accountService.activateById(account.id);
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
            testID={InactiveAccountCardSelectors.Card(accountTitle)}
            actionButtonTestID={InactiveAccountCardSelectors.ActivateButton(accountTitle)}
        />
    );
};
