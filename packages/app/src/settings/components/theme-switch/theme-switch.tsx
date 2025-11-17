import { useLingui } from '@lingui/react/macro';
import { useContext } from 'react';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ThemedSwitch } from '../../../@generic/components/themed-switch/themed-switch';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { ThemeContext } from '../../../theme/context/theme.context';
import { SettingsCard } from '../settings-card/settings-card';

export const ThemeSwitch = () => {
    const { toggleColorSchema, isDarkColorSchema } = useContext(ThemeContext);
    const { t } = useLingui();

    return (
        <SettingsCard
            title={t`Dark Mode`}
            description={t`Switch between light and dark themes`}
            right={<ThemedSwitch className="my-auto" onChange={toggleColorSchema} value={isDarkColorSchema} />}
            left={<CircleIcon size="1_5xl" icon={ICONS.Moon} variant="ghost" border={false} />}
        />
    );
};
