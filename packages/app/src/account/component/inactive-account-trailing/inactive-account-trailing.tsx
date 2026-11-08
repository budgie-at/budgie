import { AccountEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { SettingsPillButton } from '../../../settings/components/settings-pill-button/settings-pill-button';
import { isUntrackedOwnAccount } from '../../utils/is-untracked-own-account.util';
import { AccountAutomaticPill } from '../account-automatic-pill/account-automatic-pill';
import { InactiveAccountCardSelector } from '../inactive-account-card/inactive-account-card.selector';

import type { EmptyFn } from '@rnw-community/shared';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'title' | 'externalId'>;
    readonly isLoading: boolean;
    readonly onUnhide: EmptyFn;
}

export const InactiveAccountTrailing = ({ account, isLoading, onUnhide }: Props) => {
    const { t } = useLingui();
    const accountTitle = account.title;

    if (isUntrackedOwnAccount(account)) {
        return <AccountAutomaticPill />;
    }

    return (
        <SettingsPillButton
            label={t`Unhide`}
            accessibilityLabel={t`Unhide ${accountTitle}`}
            variant="secondary"
            size="sm"
            isLoading={isLoading}
            onPress={onUnhide}
            testID={InactiveAccountCardSelector.ActivateButton(accountTitle)}
        />
    );
};
