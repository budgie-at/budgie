import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { useHiddenAccountActions } from '../../context/hidden-account-actions.context';

export const HiddenAccountArchiveMenuItem = () => {
    const { t } = useLingui();
    const { archive } = useHiddenAccountActions();

    return <ActionsMenuItem icon={UserIconNameEnum.Archive} label={t`Archive`} onPress={archive} />;
};
