import { DEFAULT_RUNWAY_WINDOW, DEFAULT_TRANSACTION_FILTER, RunwayDriverDimensionEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cn } from 'cn';
import { router } from 'expo-router';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { RUNWAY_MINIMUM_MONTHS } from '../../constant/runway-minimum-months.constant';
import { useLiquidBalanceQuery } from '../../query/use-liquid-balance.query';
import { useRunwayQuery } from '../../query/use-runway.query';
import { RunwaySelector } from '../../runway.selector';

const BASE_PILL_CLASSNAME = 'flex-row items-center gap-x-xs rounded-full border px-md py-xs mt-lg';
const GROWING_VARIANT = {
    pillClassName: `${BASE_PILL_CLASSNAME} bg-positive-background border-positive-corner`,
    labelClassName: 'text-positive-foreground',
    icon: UserIconNameEnum.TrendingUp
} as const;
const BURNING_VARIANT = {
    pillClassName: `${BASE_PILL_CLASSNAME} bg-dark-warning-background border-dark-warning-corner`,
    labelClassName: 'text-dark-warning-foreground',
    icon: UserIconNameEnum.TrendingDown
} as const;
const ICON_SIZE = 14;

export const RunwayPill = () => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const liquid = useLiquidBalanceQuery();
    const { computation } = useRunwayQuery({
        filters: DEFAULT_TRANSACTION_FILTER,
        window: DEFAULT_RUNWAY_WINDOW,
        dimension: RunwayDriverDimensionEnum.CATEGORY,
        liquid
    });
    const formatDigits = useFormatDigits(0);

    if (computation.monthsUsed < RUNWAY_MINIMUM_MONTHS) {
        return null;
    }

    const handlePress = () => void router.push('/analytics?tab=runway');
    const { isPositive, net, runwayMonths } = computation;
    const formattedNet = formatDigits(convertFromMicroUnits(net), defaultInstrument.symbol);
    const formattedMonths = formatDigits(Math.round(runwayMonths ?? 0));
    const label = isPositive ? t`+${formattedNet} / mo` : t`≈ ${formattedMonths} mo`;
    const { pillClassName, labelClassName, icon } = isPositive ? GROWING_VARIANT : BURNING_VARIANT;

    return (
        <HapticPressable
            testID={RunwaySelector.Pill}
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={handlePress}
            className={pillClassName}
        >
            <Icon icon={icon} size={ICON_SIZE} className={labelClassName} />
            <ProtectedText className={cn('text-xs font-medium', labelClassName)}>{label}</ProtectedText>
        </HapticPressable>
    );
};
