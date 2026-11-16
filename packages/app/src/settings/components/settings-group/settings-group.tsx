import { ReactNode } from 'react';
import { View } from 'react-native';

import { GroupLabel } from '../../../@generic/component/group-label/group-label';

interface Props {
    title: string;
    children: ReactNode;
}

export const SettingsGroup = ({ title, children }: Props) => (
    <View className="gap-y-lg">
        <GroupLabel title={title} />

        {children}
    </View>
);
