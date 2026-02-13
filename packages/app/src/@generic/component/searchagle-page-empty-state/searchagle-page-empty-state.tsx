import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { Icon } from '../icon/icon';

interface Props {
    readonly title: string;
    readonly icon: UserIconNameEnum;
    readonly description: string;
    readonly testID?: string;
}

export const SearchablePageEmptyState = ({ title, icon, description, testID }: Props) => (
    <View testID={testID} className="items-center pt-17.5 flex-1">
        <View className="bg-secondary-background p-3xl rounded-3xl mb-3xl">
            <Icon icon={icon} className="text-secondary-foreground" size={32} />
        </View>

        <Text className="text-primary text-lg mb-md">{title}</Text>
        <Text className="text-secondary-foreground text-sm">{description}</Text>
    </View>
);
