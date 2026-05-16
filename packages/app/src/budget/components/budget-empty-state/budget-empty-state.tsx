import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';

const handleNavigate = () => void router.push('/budget/setup');

interface Props {
    readonly testID?: string;
}

export const BudgetEmptyState = ({ testID }: Props) => (
    <Card testID={testID} variant="ghost" onPress={handleNavigate} className="flex-row items-center gap-x-xl">
        <CircleIcon icon={UserIconNameEnum.PiggyBank} variant="primary" border={false} size={44} iconSize={22} />

        <View className="flex-1 gap-y-xs">
            <Text className="text-primary font-semibold text-md">
                <Trans>Create your budget</Trans>
            </Text>

            <Text className="text-secondary-foreground text-sm">
                <Trans>Set a monthly limit and track your spending</Trans>
            </Text>
        </View>
    </Card>
);
