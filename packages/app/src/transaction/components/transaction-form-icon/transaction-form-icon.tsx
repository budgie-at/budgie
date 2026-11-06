import { View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconType;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const TransactionFormIcon = ({ icon }: Props) => (
    <View className="h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-surface-disc" style={CONTINUOUS_CORNERS}>
        <Icon icon={icon} size={17} className="text-primary" />
    </View>
);
