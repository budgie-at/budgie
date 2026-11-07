import { UserIconType } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { SettingsRow } from '../../../settings/components/settings-row/settings-row';

import { HouseholdYouRowSelector } from './household-you-row.selector';

interface Props {
    readonly icon: UserIconType;
    readonly subtitle: string;
}

export const HouseholdYouRow = ({ icon, subtitle }: Props) => {
    const { t } = useLingui();

    return <SettingsRow icon={icon} variant="ghost" title={t`You`} subtitle={subtitle} testID={HouseholdYouRowSelector.Card} />;
};
