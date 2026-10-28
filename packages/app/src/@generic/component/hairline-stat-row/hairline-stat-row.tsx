import { Fragment } from 'react';
import { View } from 'react-native';

import { StatCell } from '../stat-cell/stat-cell';

import type { HairlineStatInterface } from '../../interface/hairline-stat.interface';

interface Props {
    readonly stats: readonly HairlineStatInterface[];
}

export const HairlineStatRow = ({ stats }: Props) => (
    <View className="flex-row border-y-hairline border-secondary-corner">
        {stats.map((stat, index) => {
            const isLeading = index === 0;
            const appearance = isLeading ? 'editorial-leading' : 'editorial';

            return (
                <Fragment key={stat.label}>
                    {isLeading ? null : <View className="my-xl w-hairline bg-secondary-corner" />}
                    <StatCell appearance={appearance} label={stat.label} value={stat.value} variant={stat.variant} testID={stat.testID} />
                </Fragment>
            );
        })}
    </View>
);
