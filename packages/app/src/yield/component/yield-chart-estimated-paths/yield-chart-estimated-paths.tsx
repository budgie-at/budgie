import { useIsIncreaseContrast } from '../../../@generic/hook/use-is-increase-contrast.hook';
import { YIELD_STACK_GROUPS } from '../../constant/yield-stack-groups.constant';
import { getYieldGroupAccent } from '../../utils/get-yield-group-accent.util';
import { YieldChartBarPath } from '../yield-chart-bar-path/yield-chart-bar-path';

import type { YieldBarLayoutInterface } from '../../interface/yield-bar-layout.interface';
import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly values: SharedValue<number[]>;
    readonly layout: YieldBarLayoutInterface;
    readonly pathSize: number;
}

const ESTIMATED_FILL_OPACITY = 0.25;
const ESTIMATED_STROKE = 1.5;
const CONTRAST_ESTIMATED_STROKE = 2;

export const YieldChartEstimatedPaths = ({ values, layout, pathSize }: Props) => {
    const isIncreaseContrast = useIsIncreaseContrast();

    const strokeWidth = isIncreaseContrast ? CONTRAST_ESTIMATED_STROKE : ESTIMATED_STROKE;
    const offsets = YIELD_STACK_GROUPS.map((stackGroup, index) => ({
        stackGroup,
        offset: (YIELD_STACK_GROUPS.length + index) * pathSize
    }));

    return offsets.map(({ stackGroup, offset }) => (
        <YieldChartBarPath
            key={stackGroup}
            values={values}
            offset={offset}
            rects={layout.estimated[stackGroup]}
            fillClassName={getYieldGroupAccent(stackGroup, isIncreaseContrast)}
            fillOpacity={ESTIMATED_FILL_OPACITY}
            strokeClassName={getYieldGroupAccent(stackGroup, isIncreaseContrast)}
            strokeWidth={strokeWidth}
        />
    ));
};
