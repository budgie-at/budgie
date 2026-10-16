import { UserIconNameEnum } from '@budgie/contracts';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Icon } from '../icon/icon';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly name: string;
    readonly children: ReactNode;
    readonly accessibilityLabel?: string;
    readonly testID?: string;
}

export const FileChip = ({ icon, name, children, accessibilityLabel, testID }: Props) => (
    <View
        testID={testID}
        accessible
        accessibilityLabel={accessibilityLabel}
        className="flex-1 flex-row items-center gap-x-md rounded-3xl border border-secondary-corner bg-secondary-background px-lg py-md"
    >
        <Icon icon={icon} size={16} className="text-primary" />
        <Text numberOfLines={1} className="shrink text-primary text-xs font-semibold">
            {name}
        </Text>

        {children}
    </View>
);
