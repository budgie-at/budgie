import { AccountEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { useArchivedAccountActions } from '../../context/archived-account-actions.context';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'isExternal'>;
}

export const ArchivedAccountRestoreMenuItem = ({ account }: Props) => {
    const { t } = useLingui();
    const { restore } = useArchivedAccountActions();

    if (account.isExternal) {
        return null;
    }

    return <ActionsMenuItem icon={UserIconNameEnum.ArchiveRestore} label={t`Restore`} onPress={restore} />;
};
