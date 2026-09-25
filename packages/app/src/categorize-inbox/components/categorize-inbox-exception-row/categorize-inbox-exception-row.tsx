import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { testID } from '../../../@generic/utils/test-id.util';
import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { useI18nContext } from '../../../i18n/context/i18n.context';
import { formatOperatedAt } from '../../../transaction/utils/format-operated-at.util';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';

import { CategorizeInboxExceptionRowSelector } from './categorize-inbox-exception-row.selector';

import type { CategorizeInboxRowInterface } from '@budgie/contracts';

interface Props {
    readonly row: CategorizeInboxRowInterface;
    readonly isExcluded: boolean;
}

export const CategorizeInboxExceptionRow = ({ row, isExcluded }: Props) => {
    const { t } = useLingui();
    const { intl } = useI18nContext();
    const { toggleExcluded, assignRow } = useCategorizeInboxContext();
    const [openCategorySelector] = useCategorySelectorModal();

    const handleTogglePress = () => void toggleExcluded(row.transactionId);

    const handlePickCategoryPress = async () => {
        const categoryId = await openCategorySelector({ description: row.title });

        if (isDefined(categoryId)) {
            await assignRow(row, categoryId);
        }
    };

    const handlePickCategoryPressed = () => void handlePickCategoryPress();

    const formattedDate = formatOperatedAt({
        date: row.operatedAt,
        today: t`Today`,
        yesterday: t`Yesterday`,
        formatDate: intl.formatDate
    });
    const toggleIcon = isExcluded ? UserIconNameEnum.Square : UserIconNameEnum.SquareCheck;

    return (
        <View className="flex-row items-center gap-x-lg py-sm" {...testID(CategorizeInboxExceptionRowSelector.Row, row.transactionId)}>
            <HapticPressable
                onPress={handleTogglePress}
                accessibilityRole="checkbox"
                accessibilityLabel={t`Include in bulk action`}
                {...testID(CategorizeInboxExceptionRowSelector.Toggle, row.transactionId)}
            >
                <Icon icon={toggleIcon} className="text-secondary-foreground" size={20} />
            </HapticPressable>

            <View className="flex-1 gap-y-xs">
                <Text className="text-primary text-sm" numberOfLines={1}>
                    {row.title}
                </Text>
                <Text className="text-secondary-foreground text-xs">{formattedDate}</Text>
            </View>

            <ProtectedMoney fontSize={14} minFontSize={14} maxFontSize={14} instrumentSymbol={row.instrumentSymbol}>
                {convertFromMicroUnits(row.amount)}
            </ProtectedMoney>

            <HapticPressable
                onPress={handlePickCategoryPressed}
                accessibilityRole="button"
                accessibilityLabel={t`Other…`}
                {...testID(CategorizeInboxExceptionRowSelector.Other, row.transactionId)}
            >
                <Icon icon={UserIconNameEnum.Ellipsis} className="text-secondary-foreground" size={20} />
            </HapticPressable>
        </View>
    );
};
