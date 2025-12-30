import { useLingui } from '@lingui/react/macro';

import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { useThemeContext } from '../../../theme/context/theme.context';
import { SettingsCard } from '../settings-card/settings-card';

export const ThemeSwitch = () => {
    const { toggleColorSchema, isDarkColorSchema } = useThemeContext();
    const { t } = useLingui();

    return (
        <SettingsCard
            variant="ghost"
            title={t`Dark Mode`}
            description={t`Switch between light and dark themes`}
            right={<ThemedSwitch className="my-auto" onChange={toggleColorSchema} value={isDarkColorSchema} />}
            icon="Moon"
        />
    );
};
