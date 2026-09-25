import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { testID } from '../../../@generic/utils/test-id.util';
import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';

import { CategorizeInboxClusterRowSelector } from './categorize-inbox-cluster-row.selector';

import type { CategorizeInboxRowInterface } from '@budgie/contracts';

interface Props {
    readonly row: CategorizeInboxRowInterface;
    readonly displayTitle: string;
}

const rowVariants = cva('flex-row items-center gap-x-md py-sm', {
    variants: { isIncluded: { true: '', false: 'opacity-40' } }
});

export const CategorizeInboxClusterRow = ({ row, displayTitle }: Props) => {
    const { t } = useLingui();
    const { formatDayAndMonthAndYear } = useFormatDate();
    const protectAmount = useProtectedAmountLabel();
    const { excludedTransactionIds, isBusy, toggleExcluded, assignRow } = useCategorizeInboxContext();
    const [openCategorySelector] = useCategorySelectorModal();

    const handleTogglePress = (): void => void toggleExcluded(row.transactionId);

    const handlePickCategory = async (): Promise<void> => {
        const categoryId = await openCategorySelector({ description: row.title });

        if (isDefined(categoryId)) {
            assignRow(row, categoryId);
        }
    };

    const handlePickCategoryPress = (): void => void handlePickCategory();

    const isIncluded = !excludedTransactionIds.has(row.transactionId);
    const checkboxIcon = isIncluded ? UserIconNameEnum.SquareCheck : UserIconNameEnum.Square;
    const accessibilityState = { checked: isIncluded };
    const ownTitle = row.title === displayTitle ? null : row.title;

    return (
        <View className={rowVariants({ isIncluded })} {...testID(CategorizeInboxClusterRowSelector.Row, row.transactionId)}>
            <HapticPressable
                onPress={handleTogglePress}
                accessibilityRole="checkbox"
                accessibilityState={accessibilityState}
                accessibilityLabel={t`Include in bulk action`}
                {...testID(CategorizeInboxClusterRowSelector.Checkbox, row.transactionId)}
            >
                <Icon icon={checkboxIcon} size={20} className="text-primary" />
            </HapticPressable>

            <View className="flex-1 gap-y-xxs">
                {isDefined(ownTitle) ? (
                    <Text className="text-primary text-sm" numberOfLines={1}>
                        {ownTitle}
                    </Text>
                ) : null}
                <Text className="text-secondary-foreground text-xs">{formatDayAndMonthAndYear(row.operatedAt)}</Text>
            </View>

            <Text className="text-primary text-sm font-medium">
                {protectAmount(convertFromMicroUnits(row.amount), row.instrumentSymbol)}
            </Text>

            <HapticPressable
                onPress={handlePickCategoryPress}
                disabled={isBusy}
                accessibilityRole="button"
                accessibilityLabel={t`Pick a category for this transaction`}
                {...testID(CategorizeInboxClusterRowSelector.PickCategory, row.transactionId)}
            >
                <Icon icon={UserIconNameEnum.EllipsisVertical} size={16} className="text-secondary-foreground" />
            </HapticPressable>
        </View>
    );
};
