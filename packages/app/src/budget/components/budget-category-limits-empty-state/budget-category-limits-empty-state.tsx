import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';

interface Props {
    readonly onPress: () => void;
    readonly testID?: string;
}

export const BudgetCategoryLimitsEmptyState = ({ onPress, testID }: Props) => (
    <Card variant="ghost" onPress={onPress} testID={testID}>
        <View className="items-center gap-y-md py-lg">
            <CircleIcon icon={UserIconNameEnum.Plus} variant="ghost" size={40} iconSize={20} />
            <Text className="text-primary text-md font-semibold">
                <Trans>No category limits yet</Trans>
            </Text>
            <Text className="text-secondary-foreground text-sm">
                <Trans>Add a per-category cap</Trans>
            </Text>
        </View>
    </Card>
);
