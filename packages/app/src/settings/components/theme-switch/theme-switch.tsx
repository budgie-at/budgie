import { ThemeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Uniwind, useUniwind } from 'uniwind';

import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { ColorSchemaEnum } from '../../../theme/enum/color-schema.enum';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsCard } from '../settings-card/settings-card';

interface Props {
    readonly cardTestID?: string;
    readonly switchTestID?: string;
}

export const ThemeSwitch = ({ cardTestID, switchTestID }: Props) => {
    const { theme } = useUniwind();
    const { t } = useLingui();

    const isDark = theme === 'dark';

    const handleToggle = () => {
        Uniwind.setTheme(isDark ? ColorSchemaEnum.Light : ColorSchemaEnum.Dark);
        appRuntime.runFork(logAndContinue(updateSettingsMutation({ theme: isDark ? ThemeEnum.LIGHT : ThemeEnum.DARK })));
    };

    return (
        <SettingsCard
            testID={cardTestID}
            onPress={handleToggle}
            variant="ghost"
            title={t`Dark Mode`}
            description={t`Switch between light and dark themes`}
            right={<ThemedSwitch className="my-auto" testID={switchTestID} onValueChange={handleToggle} value={isDark} />}
            icon={UserIconNameEnum.Moon}
        />
    );
};
