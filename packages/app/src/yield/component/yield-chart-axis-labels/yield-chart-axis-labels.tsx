import { Text } from 'react-native';

import { YIELD_AXIS_LABEL_HEIGHT } from '../../constant/yield-axis-label-height.constant';

import type { YieldAxisLabelInterface } from '../../interface/yield-axis-label.interface';

interface Props {
    readonly labels: readonly YieldAxisLabelInterface[];
    readonly width: number;
    readonly gutter: number;
}

const AXIS_MAX_FONT_SIZE_MULTIPLIER = 1.3;
const LABEL_RULE_GAP = 1;

export const YieldChartAxisLabels = ({ labels, width, gutter }: Props) => (
    <>
        {labels.map(({ key, y, text }) => {
            const style = { left: width, width: gutter, top: y - YIELD_AXIS_LABEL_HEIGHT - LABEL_RULE_GAP };

            return (
                <Text
                    key={key}
                    pointerEvents="none"
                    numberOfLines={1}
                    maxFontSizeMultiplier={AXIS_MAX_FONT_SIZE_MULTIPLIER}
                    className="absolute text-right text-[11px] leading-[14px] tabular-nums text-secondary-foreground"
                    style={style}
                >
                    {text}
                </Text>
            );
        })}
    </>
);
