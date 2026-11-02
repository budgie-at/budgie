import { AccountEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { MetaPill } from '../../../@generic/component/meta-pill/meta-pill';
import { SettingsPillButton } from '../../../settings/components/settings-pill-button/settings-pill-button';
import { useArchivedAccountActions } from '../../context/archived-account-actions.context';
import { ArchivedAccountCardSelector } from '../archived-account-card/archived-account-card.selector';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'title' | 'isExternal'>;
}

export const ArchivedAccountTrailing = ({ account }: Props) => {
    const { t } = useLingui();
    const { isLoading, restore } = useArchivedAccountActions();
    const accountTitle = account.title;

    if (account.isExternal) {
        return <MetaPill icon={UserIconNameEnum.Lock} label={t`Closed`} />;
    }

    return (
        <SettingsPillButton
            label={t`Restore`}
            accessibilityLabel={t`Restore ${accountTitle}`}
            variant="secondary"
            size="sm"
            isLoading={isLoading}
            onPress={restore}
            testID={ArchivedAccountCardSelector.RestoreButton(accountTitle)}
        />
    );
};
