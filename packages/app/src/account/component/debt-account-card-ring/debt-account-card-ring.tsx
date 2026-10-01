import { AccountDebtTypeEnum, UserIconType } from '@budgie/contracts';
import { cn } from 'cn';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { useThemeContext } from '../../../theme/context/theme.context';
import { DEBT_DIRECTION_COLOR } from '../../constant/debt-direction-color.constant';
import { DEBT_PROGRESS_RING_COLORS } from '../../constant/debt-progress-ring-colors.constant';
import { useDebtProgressFill } from '../../hooks/use-debt-progress-fill.hook';

import { DebtAccountCardRingSelector } from './debt-account-card-ring.selector';

interface Props {
    readonly debtType: AccountDebtTypeEnum;
    readonly icon: UserIconType;
    readonly percentage: number | null;
    readonly title: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const HALF = 2;
const FULL_PERCENTAGE = 100;
const RING_SIZE = 52;
const RING_STROKE_WIDTH = 3;
const RING_ROTATION = -90;
const RING_CENTER = RING_SIZE / HALF;
const RING_RADIUS = (RING_SIZE - RING_STROKE_WIDTH) / HALF;
const RING_CIRCUMFERENCE = HALF * Math.PI * RING_RADIUS;
const SVG_FILL_NONE = 'none' as const;
const SVG_STROKE_LINECAP_ROUND = 'round' as const;

export const DebtAccountCardRing = ({ debtType, icon, percentage, title }: Props) => {
    const { colorScheme } = useThemeContext();
    const progress = useDebtProgressFill(percentage ?? 0);

    const fillAnimatedProps = useAnimatedProps(() => ({
        strokeDashoffset: RING_CIRCUMFERENCE * (1 - progress.get() / FULL_PERCENTAGE)
    }));

    const colors = DEBT_PROGRESS_RING_COLORS[colorScheme];
    const directionColor = DEBT_DIRECTION_COLOR[debtType];
    const percentageColorClassName = isPositiveNumber(percentage) ? FOREGROUND_COLOR_PALETTE[directionColor] : 'text-secondary-foreground';

    return (
        <View className="h-[52px] w-[52px] items-center justify-center">
            <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
                <Circle
                    cx={RING_CENTER}
                    cy={RING_CENTER}
                    r={RING_RADIUS}
                    stroke={colors.track}
                    strokeWidth={RING_STROKE_WIDTH}
                    fill={SVG_FILL_NONE}
                />

                {isPositiveNumber(percentage) && (
                    <AnimatedCircle
                        cx={RING_CENTER}
                        cy={RING_CENTER}
                        r={RING_RADIUS}
                        stroke={colors.fill[debtType]}
                        strokeWidth={RING_STROKE_WIDTH}
                        fill={SVG_FILL_NONE}
                        strokeLinecap={SVG_STROKE_LINECAP_ROUND}
                        strokeDasharray={`${RING_CIRCUMFERENCE}`}
                        rotation={RING_ROTATION}
                        origin={`${RING_CENTER}, ${RING_CENTER}`}
                        animatedProps={fillAnimatedProps}
                    />
                )}
            </Svg>

            {isDefined(percentage) && (
                <Text
                    className={cn('text-xs font-semibold tabular-nums', percentageColorClassName)}
                    testID={DebtAccountCardRingSelector.Percentage(title, percentage)}
                >
                    {`${percentage}%`}
                </Text>
            )}

            <CircleIcon
                size={22}
                iconSize={12}
                radius={11}
                icon={icon}
                variant={directionColor}
                className="absolute -bottom-1 -right-1.5 border-2 border-primary-reverse"
            />
        </View>
    );
};
