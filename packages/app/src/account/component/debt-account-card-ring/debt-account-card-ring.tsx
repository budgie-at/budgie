import { AccountDebtTypeEnum, UserIconType } from '@budgie/contracts';
import { cn } from 'cn';
import { styled } from 'nativewind';
import { Text, View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

import { DebtAccountCardRingSelector } from './debt-account-card-ring.selector';

interface Props {
    readonly debtType: AccountDebtTypeEnum;
    readonly icon: UserIconType;
    readonly percentage: number | null;
    readonly title: string;
}

const StyledSvg = styled(Svg, { className: { target: 'style' } });

const DIRECTION_VARIANT: Record<AccountDebtTypeEnum, ColorPaletteVariant> = {
    [AccountDebtTypeEnum.BORROW]: 'destructive',
    [AccountDebtTypeEnum.LENT]: 'positive'
};

const RADIUS = 24.5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const DebtAccountCardRing = ({ debtType, icon, percentage, title }: Props) => {
    const variant = DIRECTION_VARIANT[debtType];
    const colorClassName = FOREGROUND_COLOR_PALETTE[variant];
    const progressDashArray = `${(CIRCUMFERENCE * (percentage ?? 0)) / 100} ${CIRCUMFERENCE}`;

    return (
        <View className="h-[52px] w-[52px] items-center justify-center">
            <StyledSvg width={52} height={52} className={cn('absolute -rotate-90', colorClassName)}>
                <Circle cx={26} cy={26} r={RADIUS} stroke="currentColor" strokeWidth={3} strokeOpacity={0.2} fill="none" />
                {isPositiveNumber(percentage) && (
                    <Circle
                        cx={26}
                        cy={26}
                        r={RADIUS}
                        stroke="currentColor"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeDasharray={progressDashArray}
                        fill="none"
                    />
                )}
            </StyledSvg>

            {isDefined(percentage) && (
                <Text
                    className={cn('text-xs font-semibold tabular-nums', colorClassName)}
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
                variant={variant}
                className="absolute -bottom-1 -right-1.5 border-2 border-primary-reverse"
            />
        </View>
    );
};
