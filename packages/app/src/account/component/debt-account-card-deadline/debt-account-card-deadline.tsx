import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cn } from 'cn';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { BACKGROUND_COLOR_PALETTE } from '../../../@generic/constant/background-color-palette.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { getDebtDeadlineRemaining } from '../../utils/get-debt-deadline-remaining.util';
import { isDebtDeadlineUrgent } from '../../utils/is-debt-deadline-urgent.util';

interface Props {
    readonly createdAt: Date;
    readonly deadline: Date;
}

export const DebtAccountCardDeadline = ({ createdAt, deadline }: Props) => {
    const { t } = useLingui();

    const remaining = getDebtDeadlineRemaining(deadline);
    const { years = 0, months = 0, days = 0 } = remaining ?? {};
    const monthsLabel = t`${months}mo`;
    const shortLabel = isPositiveNumber(months) ? monthsLabel : t`${days}d`;
    const longLabel = isPositiveNumber(months) ? `${t`${years}y`} ${monthsLabel}` : t`${years}y`;
    const remainingLabel = isPositiveNumber(years) ? longLabel : shortLabel;
    const label = isDefined(remaining) ? remainingLabel : t`Overdue`;
    const urgencyVariant: ColorPaletteVariant = isDebtDeadlineUrgent(createdAt, deadline) ? 'dark-warning' : 'secondary';
    const variant: ColorPaletteVariant = isDefined(remaining) ? urgencyVariant : 'destructive';
    const foregroundClassName = cn(FOREGROUND_COLOR_PALETTE[variant]);
    const fontWeightClassName = variant === 'secondary' ? 'font-normal' : 'font-semibold';

    return (
        <View className={cn('flex-row items-center gap-x-xs self-start rounded-full px-md py-xs', BACKGROUND_COLOR_PALETTE[variant])}>
            <Icon icon={UserIconNameEnum.Clock} className={foregroundClassName} size={11} />
            <Text className={cn('text-xxs', foregroundClassName, fontWeightClassName)}>{label}</Text>
        </View>
    );
};
