import { useLingui } from '@lingui/react/macro';
import { useContext } from 'react';
import { Switch } from 'react-native';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { ThemeContext } from '../../../theme/context/theme.context';
import { SettingsCard } from '../settings-card/settings-card';

export const ThemeSwitch = () => {
    const { toggleColorSchema, isDarkColorSchema } = useContext(ThemeContext);
    const { t } = useLingui();

    const thumbColor = isDarkColorSchema ? '#000000' : '#ffffff';
    const iosBackgroundColor = isDarkColorSchema ? '#ffffff' : '#000000';

    const trackColor = {
        false: isDarkColorSchema ? '#000000' : '#ffffff',
        true: isDarkColorSchema ? '#ffffff' : '#000000'
    };

    return (
        <SettingsCard
            title={t`Dark Mode`}
            description={t`Switch between light and dark themes`}
            right={
                <Switch
                    className="my-auto"
                    onChange={toggleColorSchema}
                    value={isDarkColorSchema}
                    trackColor={trackColor}
                    thumbColor={thumbColor}
                    ios_backgroundColor={iosBackgroundColor}
                />
            }
            left={<CircleIcon size="1_5xl" icon={ICONS.Moon} variant="ghost" border={false} />}
        />
    );
};
