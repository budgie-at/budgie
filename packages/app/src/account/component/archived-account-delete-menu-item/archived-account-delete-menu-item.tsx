import { AccountEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { useArchivedAccountActions } from '../../context/archived-account-actions.context';
import { ArchivedAccountCardSelector } from '../archived-account-card/archived-account-card.selector';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'title'>;
}

export const ArchivedAccountDeleteMenuItem = ({ account }: Props) => {
    const { t } = useLingui();
    const { deleteAccount } = useArchivedAccountActions();

    return (
        <ActionsMenuItem
            icon={UserIconNameEnum.Trash2}
            label={t`Delete permanently`}
            onPress={deleteAccount}
            variant="destructive"
            testID={ArchivedAccountCardSelector.DeleteButton(account.title)}
        />
    );
};
