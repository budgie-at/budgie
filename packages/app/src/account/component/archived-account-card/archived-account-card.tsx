import { AccountEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { useSettingsContext } from '../../../settings/context/settings.context';
import { accountService } from '../../service/account.service';
import { AccountActionCard } from '../account-action-card/account-action-card';

interface Props {
    readonly account: AccountEntityInterface;
}

export const ArchivedAccountCard = ({ account }: Props) => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();

    const handleRestore = async () => {
        await accountService.restoreById(account.id);
    };

    const accountTitle = account.title;

    return (
        <AccountActionCard
            account={account}
            actionIcon="RotateCcw"
            actionButtonText={t`Restore`}
            confirmTitle={t`Restore Account?`}
            confirmDescription={t`${accountTitle} will be restored to your main view and included in totals.`}
            errorText={t`Could not restore account.`}
            currencySymbol={defaultInstrument.symbol}
            onAction={handleRestore}
        />
    );
};
