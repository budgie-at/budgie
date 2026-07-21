import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly title: string;
    readonly description: string;
    readonly summary?: string;
    readonly onPress: () => void;
    readonly testID?: string;
}

export const BudgetTemplateOptionCard = ({ icon, title, description, summary, onPress, testID }: Props) => (
    <Card testID={testID} variant="ghost" onPress={onPress} className="flex-row items-center gap-x-xl">
        <CircleIcon icon={icon} variant="primary" border={false} size={44} iconSize={22} />

        <View className="flex-1 gap-y-xs">
            <Text className="text-primary font-semibold text-md">{title}</Text>
            <Text className="text-secondary-foreground text-sm">{description}</Text>
            {isDefined(summary) && <Text className="text-secondary-foreground text-sm">{summary}</Text>}
        </View>
    </Card>
);
