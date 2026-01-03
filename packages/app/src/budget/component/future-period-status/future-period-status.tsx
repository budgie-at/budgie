import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly isCreated: boolean;
    readonly isCreating: boolean;
}

export const FuturePeriodStatus = ({ isCreated, isCreating }: Props) => {
    if (isCreated) {
        return (
            <View className="flex-row items-center gap-1">
                <Icon icon={UserIconNameEnum.CheckCircle} size={16} className="text-positive-foreground" />
                <Text className="text-xs text-positive-foreground">
                    <Trans>Planned</Trans>
                </Text>
            </View>
        );
    }

    if (isCreating) {
        return (
            <Text className="text-xs text-secondary-foreground">
                <Trans>Creating...</Trans>
            </Text>
        );
    }

    return (
        <View className="flex-row items-center gap-1">
            <Icon icon={UserIconNameEnum.Plus} size={16} className="text-primary" />
            <Text className="text-xs text-primary">
                <Trans>Plan</Trans>
            </Text>
        </View>
    );
};
