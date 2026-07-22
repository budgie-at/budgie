import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly title: string;
    readonly testID?: string;
}

export const TransactionTagPill = ({ title, testID }: Props) => (
    <View
        className="h-10 flex-row items-center gap-x-sm rounded-full border border-secondary-corner bg-ghost-background px-3xl"
        testID={testID}
    >
        <Icon icon={UserIconNameEnum.Tag} size={16} className="text-primary" />
        <Text className="text-sm text-primary font-medium" numberOfLines={1} ellipsizeMode="tail">
            {title}
        </Text>
    </View>
);
