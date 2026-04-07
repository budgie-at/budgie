import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { CircleIcon } from '../circle-icon/circle-icon';

interface Props {
    readonly title: string;
    readonly icon: UserIconNameEnum;
    readonly description: string;
    readonly testID?: string;
}

export const SearchablePageEmptyState = ({ title, icon, description, testID }: Props) => (
    <View testID={testID} className="flex-1 items-center justify-center px-6xl pb-16xl">
        <CircleIcon icon={icon} variant="warning" size={68} radius={24} iconSize={30} className="mb-4xl" />
        <Text className="text-primary text-center text-lg font-medium mb-md">{title}</Text>
        <Text className="text-secondary-foreground text-center text-sm max-w-70">{description}</Text>
    </View>
);
