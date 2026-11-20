import { View } from 'react-native';
import Svg, { G } from 'react-native-svg';

import { YIELD_AXIS_GUTTER } from '../../constant/yield-axis-gutter.constant';
import { YIELD_LABEL_BAND } from '../../constant/yield-label-band.constant';
import { YIELD_PLOT_HEIGHT } from '../../constant/yield-plot-height.constant';
import { YieldChartAxisLabels } from '../yield-chart-axis-labels/yield-chart-axis-labels';
import { YieldChartAxis } from '../yield-chart-axis/yield-chart-axis';

import type { YieldAxisInterface } from '../../interface/yield-axis.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly axis: YieldAxisInterface;
    readonly width: number;
    readonly children: ReactNode;
    readonly label: ReactNode;
}

const SVG_HEIGHT = YIELD_PLOT_HEIGHT + YIELD_LABEL_BAND;
const LABELS_OFFSET = { top: YIELD_LABEL_BAND, height: YIELD_PLOT_HEIGHT };

export const YieldChartFrame = ({ axis, width, children, label }: Props) => {
    const containerStyle = { width: width + YIELD_AXIS_GUTTER, height: SVG_HEIGHT };
    const labelsStyle = { ...LABELS_OFFSET, width: width + YIELD_AXIS_GUTTER };

    return (
        <View style={containerStyle}>
            <Svg width={width} height={SVG_HEIGHT}>
                <G y={YIELD_LABEL_BAND}>
                    <YieldChartAxis axis={axis} width={width} height={YIELD_PLOT_HEIGHT} />
                    {children}
                </G>
            </Svg>

            <View pointerEvents="none" className="absolute left-0" style={labelsStyle}>
                <YieldChartAxisLabels axis={axis} width={width} height={YIELD_PLOT_HEIGHT} />
            </View>

            {label}
        </View>
    );
};
