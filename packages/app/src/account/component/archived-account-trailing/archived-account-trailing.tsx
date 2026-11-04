import { AccountEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { EmptyFn } from '@rnw-community/shared';

import { MetaPill } from '../../../@generic/component/meta-pill/meta-pill';
import { SettingsPillButton } from '../../../settings/components/settings-pill-button/settings-pill-button';
import { ArchivedAccountCardSelector } from '../archived-account-card/archived-account-card.selector';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'title' | 'isExternal'>;
    readonly isLoading: boolean;
    readonly onRestore: EmptyFn;
}

export const ArchivedAccountTrailing = ({ account, isLoading, onRestore }: Props) => {
    const { t } = useLingui();
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
            onPress={onRestore}
            testID={ArchivedAccountCardSelector.RestoreButton(accountTitle)}
        />
    );
};
