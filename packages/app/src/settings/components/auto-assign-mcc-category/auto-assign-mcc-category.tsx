import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { useSetting } from '../../hook/use-setting.hook';
import { runSettingsUpdate } from '../../utils/run-settings-update.util';
import { SettingsRow } from '../settings-row/settings-row';

import { AutoAssignMccCategorySelector } from './auto-assign-mcc-category.selector';

export const AutoAssignMccCategory = () => {
    const { t } = useLingui();
    const applyMccDefaultCategory = useSetting('applyMccDefaultCategory');

    const handleToggle = (value: boolean) => {
        void runSettingsUpdate({ applyMccDefaultCategory: value });
    };

    return (
        <SettingsRow
            title={t`Apply merchant categories`}
            subtitle={t`Only when a category is missing`}
            icon={UserIconNameEnum.Store}
            variant="ghost"
            right={
                <ThemedSwitch
                    testID={AutoAssignMccCategorySelector.ToggleSwitch}
                    onValueChange={handleToggle}
                    accessibilityLabel={t`Apply merchant categories`}
                    value={applyMccDefaultCategory}
                />
            }
        />
    );
};
