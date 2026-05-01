import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { useThemeContext } from '../../../theme/context/theme.context';
import { SettingsCard } from '../settings-card/settings-card';

interface Props {
    readonly cardTestID?: string;
    readonly switchTestID?: string;
}

export const ThemeSwitch = ({ cardTestID, switchTestID }: Props) => {
    const { toggleColorSchema, isDarkColorSchema } = useThemeContext();
    const { t } = useLingui();

    return (
        <SettingsCard
            testID={cardTestID}
            variant="ghost"
            title={t`Dark Mode`}
            description={t`Switch between light and dark themes`}
            right={<ThemedSwitch className="my-auto" testID={switchTestID} onChange={toggleColorSchema} value={isDarkColorSchema} />}
            icon={UserIconNameEnum.Moon}
        />
    );
};
