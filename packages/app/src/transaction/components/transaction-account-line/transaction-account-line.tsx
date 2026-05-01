import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

import type { TransactionAccountLinePropsInterface } from '../../interface/transaction-account-line-props.interface';

export const TransactionAccountLine = ({ direction, icon, title, testID }: TransactionAccountLinePropsInterface) => {
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
