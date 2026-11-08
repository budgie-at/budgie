import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { DEFAULT_DECIMAL_PLACES } from '../../../i18n/constant/default-decimal-places.constant';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { decimalPlacesAtom } from '../../../settings/constants/settings-atoms.constant';

interface Props {
    readonly canConfirm: boolean;
    readonly remainingAmount: number;
    readonly currencySymbol: string;
    readonly isFullySplit: boolean;
    readonly isOverBudget: boolean;
    readonly hasMissingCategories: boolean;
}

export const SplitEntriesRemainder = (props: Props) => {
    const { canConfirm, remainingAmount, currencySymbol, isFullySplit, isOverBudget, hasMissingCategories } = props;
    const { t } = useLingui();
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const formatDigits = useFormatDigits(Math.max(decimalPlaces, DEFAULT_DECIMAL_PLACES));
    const formattedRemaining = formatDigits(Math.abs(remainingAmount), currencySymbol);
    const assignedLabel = isFullySplit ? t`Fully assigned` : t`${formattedRemaining} left to assign`;
    const pendingLabel = hasMissingCategories ? t`Select all categories` : assignedLabel;
    const remainderLabel = isOverBudget ? t`${formattedRemaining} over budget` : pendingLabel;
    const remainderClassName = isOverBudget ? 'text-destructive-strong' : 'text-secondary-foreground';

    return (
        <View className="pt-lg flex-row items-center justify-center gap-x-sm">
            {canConfirm ? <Icon icon={UserIconNameEnum.Check} size={16} className="text-secondary-foreground" /> : null}
            <Text className={cn('text-center text-[15px] leading-[20px] shrink', remainderClassName)}>{remainderLabel}</Text>
        </View>
    );
};
