import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly testID?: string;
}

export const TransactionMetadataRow = ({ icon, label, testID }: Props) => (
    <View className="flex-row items-center gap-x-xs min-w-0" testID={testID}>
        <CircleIcon icon={icon} variant="ghost" size={18} iconSize={10} radius={9} border={false} />
        <Text className="text-secondary-foreground text-xs flex-1 min-w-0" numberOfLines={1} ellipsizeMode="tail">
            {label}
        </Text>
    </View>
);
