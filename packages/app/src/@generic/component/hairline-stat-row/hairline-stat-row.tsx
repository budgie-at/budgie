import { View } from 'react-native';

import { StatCell } from '../stat-cell/stat-cell';

import type { HairlineStatInterface } from '../../interface/hairline-stat.interface';

interface Props {
    readonly stats: readonly HairlineStatInterface[];
}

export const HairlineStatRow = ({ stats }: Props) => (
    <View className="flex-row gap-x-7xl border-t-hairline border-secondary-corner">
        {stats.map(stat => (
            <StatCell
                key={stat.label}
                appearance="editorial"
                label={stat.label}
                value={stat.value}
                variant={stat.variant}
                testID={stat.testID}
            />
        ))}
    </View>
);
