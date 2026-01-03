import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly categoriesOverBudget: number;
}

export const WidgetStatusIndicator = ({ categoriesOverBudget }: Props) => {
    if (isPositiveNumber(categoriesOverBudget)) {
        return (
            <View className="flex-row items-center gap-1">
                <Icon icon={UserIconNameEnum.AlertTriangle} size={12} className="text-warning-foreground" />
                <Text className="text-xs text-warning-foreground">
                    <Trans>{categoriesOverBudget} over budget</Trans>
                </Text>
            </View>
        );
    }

    return (
        <Text className="text-xs text-positive-foreground">
            <Trans>On track</Trans>
        </Text>
    );
};
