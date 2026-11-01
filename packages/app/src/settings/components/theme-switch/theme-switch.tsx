import { ThemeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { SegmentedTabs } from '../../../@generic/component/segmented-tabs/segmented-tabs';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useSetting } from '../../hook/use-setting.hook';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';

interface Props {
    readonly testID: string;
}

export const ThemeSwitch = ({ testID }: Props) => {
    const { t } = useLingui();
    const theme = useSetting('theme');

    const options = [
        { value: ThemeEnum.SYSTEM, label: t`Automatic` },
        { value: ThemeEnum.LIGHT, label: t`Light` },
        { value: ThemeEnum.DARK, label: t`Dark` }
    ];
    const handleChange = (next: ThemeEnum) =>
        void appRuntime.runFork(logAndContinue(updateSettingsMutation({ theme: next }).pipe(toastOnFailure(t`Could not update settings`))));

    return (
        <GroupedListRow
            testID={testID}
            left={
                <View className="self-start">
                    <CircleIcon
                        icon={UserIconNameEnum.SunMoon}
                        variant="ghost"
                        size={36}
                        iconSize={18}
                        radius={18}
                        border={false}
                        className={TONAL_DISC_BACKGROUND.ghost}
                    />
                </View>
            }
            title={t`Appearance`}
            subtitle={
                <View className="pt-xs">
                    <SegmentedTabs options={options} value={theme} onChange={handleChange} />
                </View>
            }
        />
    );
};
