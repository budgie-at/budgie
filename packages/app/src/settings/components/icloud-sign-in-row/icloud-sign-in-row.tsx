import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { SettingsRowAccessoryKindEnum } from '../../enum/settings-row-accessory-kind.enum';
import { SettingsRowAccessory } from '../settings-row-accessory/settings-row-accessory';
import { SettingsRowIcon } from '../settings-row-icon/settings-row-icon';

export const ICloudSignInRow = () => {
    const { t } = useLingui();
    const pressableProps = { accessible: true, accessibilityRole: 'text' as const, accessibilityLabel: t`Apple Account, not signed in` };

    return (
        <GroupedListRow
            left={<SettingsRowIcon icon={UserIconNameEnum.Cloud} variant="ghost" />}
            title={t`Apple Account`}
            right={<SettingsRowAccessory value={t`Not signed in`} kind={SettingsRowAccessoryKindEnum.VALUE} />}
            pressableProps={pressableProps}
            testID={SettingsPageSelector.ICloudSignInCard}
        />
    );
};
