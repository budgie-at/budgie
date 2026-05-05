import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { RefundedSummaryKindEnum } from '../../enum/refunded-summary-kind.enum';
import { computeRefundedSummary } from '../../utils/compute-refunded-summary.util';

import type { RefundedPillPropsInterface } from '../../interface/refunded-pill-props.interface';

const PILL_ICON_SIZE = 12;
const ENTER_DURATION_MS = 200;
const baseClassName = 'flex-row items-center gap-x-xs rounded-full px-sm py-[2px] border border-secondary-corner bg-secondary-background';
const labelClassName = 'text-xs text-secondary-foreground';
const continuousBorder = { borderCurve: 'continuous' as const };

export const RefundedPill = ({ transaction, onPress, testID }: RefundedPillPropsInterface) => {
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const summary = computeRefundedSummary(transaction);
    const currencySymbol = transaction.entries[0]?.account.instrument.symbol;

    if (!isDefined(summary)) {
        return null;
    }

    const formattedRefundedAmount =
        summary.kind === RefundedSummaryKindEnum.PARTIAL && isNotEmptyString(currencySymbol)
            ? formatDigits(convertFromMicroUnits(summary.refundsTotal), currencySymbol)
            : null;
    const label = isNotEmptyString(formattedRefundedAmount) ? t`Refunded ${formattedRefundedAmount}` : t`Refunded`;

    const body = (
        <View className={baseClassName} style={continuousBorder}>
            <Icon icon={UserIconNameEnum.RotateCcw} size={PILL_ICON_SIZE} className={labelClassName} />
            <Text className={labelClassName} numberOfLines={1} ellipsizeMode="tail">
                {label}
            </Text>
        </View>
    );

    if (!isDefined(onPress)) {
        return (
            <View className="flex-row">
                <Animated.View entering={FadeIn.duration(ENTER_DURATION_MS)} testID={testID}>
                    {body}
                </Animated.View>
            </View>
        );
    }

    return (
        <View className="flex-row">
            <Animated.View entering={FadeIn.duration(ENTER_DURATION_MS)}>
                <HapticPressable onPress={onPress} testID={testID}>
                    {body}
                </HapticPressable>
            </Animated.View>
        </View>
    );
};
