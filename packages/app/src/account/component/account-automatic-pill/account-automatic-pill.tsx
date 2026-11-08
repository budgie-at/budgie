import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { MetaPill } from '../../../@generic/component/meta-pill/meta-pill';

export const AccountAutomaticPill = () => {
    const { t } = useLingui();

    return <MetaPill icon={UserIconNameEnum.Sparkles} label={t`Automatic`} />;
};
