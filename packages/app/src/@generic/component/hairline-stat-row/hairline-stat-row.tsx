import { Fragment } from 'react';
import { View } from 'react-native';

import { StatCell } from '../stat-cell/stat-cell';

import type { HairlineStatInterface } from '../../interface/hairline-stat.interface';

interface Props {
    readonly stats: readonly HairlineStatInterface[];
}

export const HairlineStatRow = ({ stats }: Props) => (
    <View className="flex-row border-y-hairline border-secondary-corner py-lg">
        {stats.map((stat, index) => (
            <Fragment key={stat.label}>
                {index > 0 ? <View className="w-hairline self-stretch bg-secondary-corner" /> : null}
                <StatCell appearance="editorial" label={stat.label} value={stat.value} variant={stat.variant} testID={stat.testID} />
            </Fragment>
        ))}
    </View>
);
