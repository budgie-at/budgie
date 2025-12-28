import { Text, View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { IconName } from '../../../@generic/constant/icons.constant';

interface Props {
    readonly icon: IconName;
    readonly title: string;
    readonly onCreate: EmptyFn;
    readonly buttonText: string;
    readonly description: string;
}

export const TransactionFilterEmptyState = ({ icon, title, description, onCreate, buttonText }: Props) => (
    <View className="rounded-5xl border border-secondary-corner bg-secondary-background py-12.5 px-5xl items-center">
        <CircleIcon icon={icon} variant="ghost" size={64} iconSize={32} className="rounded-3xl mb-3xl" />

        <Text className="text-primary text-md font-semibold mb-lg">{title}</Text>
        <Text className="text-secondary-foreground text-sm text-center mb-7xl">{description}</Text>

        <Button onPress={onCreate} leftIcon="Plus" content={buttonText} />
    </View>
);
