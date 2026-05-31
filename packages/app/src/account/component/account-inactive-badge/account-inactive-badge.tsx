import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

export const AccountInactiveBadge = () => (
    <View className="flex-row items-center gap-xxs self-start rounded-full bg-secondary-corner px-sm py-xxs">
        <Icon icon={UserIconNameEnum.EyeOff} size={10} className="text-secondary-foreground" />
        <Text className="text-xxs font-semibold uppercase tracking-wide text-secondary-foreground">
            <Trans>Inactive</Trans>
        </Text>
    </View>
);
