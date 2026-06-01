import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

import type { UserIconNameEnum } from '@budgie/contracts';

interface Props {
    readonly direction: 'from' | 'to';
    readonly icon: UserIconNameEnum;
    readonly title: string;
    readonly testID?: string;
}

export const TransactionAccountLine = ({ direction, icon, title, testID }: Props) => {
    const directionLabel = direction === 'from' ? <Trans>from</Trans> : <Trans>to</Trans>;

    return (
        <View className="flex-row items-center gap-x-sm" testID={testID}>
            <Text className="text-xs text-secondary-foreground">{directionLabel}</Text>
            <Icon icon={icon} className="text-secondary-foreground" size={12} />
            <Text className="text-xs font-medium text-secondary-foreground flex-1" numberOfLines={1}>
                {title}
            </Text>
        </View>
    );
};
