import { RunwayDriverDimensionEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cn } from 'cn';
import { router } from 'expo-router';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { RUNWAY_MINIMUM_MONTHS } from '../../constant/runway-minimum-months.constant';
import { useLiquidBalanceQuery } from '../../query/use-liquid-balance.query';
import { useRunwayQuery } from '../../query/use-runway.query';
import { RunwaySelector } from '../../runway.selector';

const BASE_PILL_CLASSNAME = 'flex-row items-center gap-x-xs rounded-full border px-md py-xs';
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
    const isAmountProtected = useIsAmountProtected();
    const liquid = useLiquidBalanceQuery();
    const { computation } = useRunwayQuery({ dimension: RunwayDriverDimensionEnum.CATEGORY, liquid });
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
            <ProtectedText className={cn('text-xs font-medium', labelClassName)}>{label}</ProtectedText>
        </HapticPressable>
    );
};
