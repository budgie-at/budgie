import { Trans } from '@lingui/react/macro';
import { useContext } from 'react';
import { Switch, Text, View } from 'react-native';

import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { ThemeContext } from '../../../theme/context/theme.context';

export const ThemeSwitch = () => {
    const { toggleColorSchema, isDarkColorSchema } = useContext(ThemeContext);

    const thumbColor = isDarkColorSchema ? '#000000' : '#ffffff';
    const iosBackgroundColor = isDarkColorSchema ? '#ffffff' : '#000000';

    const trackColor = {
        false: isDarkColorSchema ? '#000000' : '#ffffff',
        true: isDarkColorSchema ? '#ffffff' : '#000000'
    };

    return (
        <Card className="flex-row gap-x-xl bg-secondary-background items-center">
            <CircleIcon size="xl" icon={ICONS.Moon} variant="ghost" />

            <View className="gap-y-sm flex-1">
                <Text className="text-primary text-md">
                    <Trans>Dark Mode</Trans>
                </Text>
                <Text className="text-secondary-foreground text-sm">
                    <Trans>Switch between light and dark themes</Trans>
                </Text>
            </View>

            <Switch
                className="my-auto"
                onChange={toggleColorSchema}
                value={isDarkColorSchema}
                trackColor={trackColor}
                thumbColor={thumbColor}
                ios_backgroundColor={iosBackgroundColor}
            />
        </Card>
    );
};
