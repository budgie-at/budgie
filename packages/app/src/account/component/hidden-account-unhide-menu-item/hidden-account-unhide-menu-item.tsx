import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { useHiddenAccountActions } from '../../context/hidden-account-actions.context';

export const HiddenAccountUnhideMenuItem = () => {
    const { t } = useLingui();
    const { unhide } = useHiddenAccountActions();

    return <ActionsMenuItem icon={UserIconNameEnum.Eye} label={t`Unhide`} onPress={unhide} />;
};
