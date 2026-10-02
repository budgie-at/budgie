import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { useSetting } from '../../hook/use-setting.hook';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsCard } from '../settings-card/settings-card';

import { AutoAssignMccCategorySelector } from './auto-assign-mcc-category.selector';

export const AutoAssignMccCategory = () => {
    const { t } = useLingui();
    const applyMccDefaultCategory = useSetting('applyMccDefaultCategory');

    const handleToggle = (value: boolean) => {
        void appRuntime.runPromise(updateSettingsMutation({ applyMccDefaultCategory: value }));
    };

    return (
        <SettingsCard
            title={t`Auto-assign categories from MCC`}
            description={t`Apply default categories based on merchant category codes`}
            icon={UserIconNameEnum.Tag}
            variant="default"
            right={
                <ThemedSwitch
                    className="my-auto"
                    testID={AutoAssignMccCategorySelector.ToggleSwitch}
                    onValueChange={handleToggle}
                    value={applyMccDefaultCategory}
                />
            }
        />
    );
};
