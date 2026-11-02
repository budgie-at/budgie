import { AccountEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'id'>;
}

export const HiddenAccountEditMenuItem = ({ account }: Props) => {
    const { t } = useLingui();

    const handleEdit = () => void router.push({ pathname: '/account/[id]/update', params: { id: String(account.id) } });

    return <ActionsMenuItem icon={UserIconNameEnum.Pencil} label={t`Edit account`} onPress={handleEdit} />;
};
