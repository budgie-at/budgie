import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly count: number;
}

export const BudgetOverBudgetWarning = ({ count }: Props) => (
    <View className="flex-row items-center gap-1 pt-1">
        <Icon icon={UserIconNameEnum.AlertTriangle} size={12} className="text-warning-foreground" />
        <Text className="text-xs text-warning-foreground">
            <Trans>{count} categories over budget</Trans>
        </Text>
    </View>
);
