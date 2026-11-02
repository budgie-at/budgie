import { RunwayDriverDimensionEnum, UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { RUNWAY_MINIMUM_MONTHS } from '../../constant/runway-minimum-months.constant';
import { useLiquidBalanceQuery } from '../../query/use-liquid-balance.query';
import { useRunwayQuery } from '../../query/use-runway.query';
import { RunwaySelector } from '../../runway.selector';

const BASE_PILL_CLASSNAME = 'min-h-[28px] flex-row items-center gap-x-xs rounded-full px-md py-xs';
const GROWING_VARIANT = {
    pillClassName: `${BASE_PILL_CLASSNAME} bg-positive-background`,
    labelClassName: 'text-positive-foreground',
    icon: UserIconNameEnum.TrendingUp
} as const;
const BURNING_VARIANT = {
    pillClassName: `${BASE_PILL_CLASSNAME} bg-dark-warning-background`,
    labelClassName: 'text-dark-warning-foreground',
    icon: UserIconNameEnum.TrendingDown
} as const;
const ICON_SIZE = 14;

export const RunwayPill = () => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const isAmountProtected = useIsAmountProtected();
    const liquid = useLiquidBalanceQuery();
    const { computation } = useRunwayQuery({ dimension: RunwayDriverDimensionEnum.CATEGORY, liquid, isAllIn: true });
    const formatDigits = useFormatDigits(0);

    if (computation.monthsUsed < RUNWAY_MINIMUM_MONTHS) {
        return null;
    }

    const handlePress = () => void router.push('/analytics?tab=runway');
    const formattedNet = formatDigits(convertFromMicroUnits(computation.net), defaultInstrument.symbol);
    const formattedMonths = formatDigits(Math.round(computation.runwayMonths ?? 0));
    const label = computation.isPositive ? t`+${formattedNet} / mo` : t`≈ ${formattedMonths} mo`;
    const { pillClassName, labelClassName, icon } = computation.isPositive ? GROWING_VARIANT : BURNING_VARIANT;
    const accessibilityLabel = isAmountProtected ? t`Runway` : label;

    return (
        <HapticPressable
            testID={RunwaySelector.Pill}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            onPress={handlePress}
            className={pillClassName}
        >
            <Icon icon={icon} size={ICON_SIZE} className={labelClassName} />
            <ProtectedText
                maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
                className={cn('text-[13px] font-medium tabular-nums', labelClassName)}
            >
                {label}
            </ProtectedText>
        </HapticPressable>
    );
};
