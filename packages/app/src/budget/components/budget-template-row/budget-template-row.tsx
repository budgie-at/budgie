import { BudgetPeriodEnum, BudgetTemplateEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { styled } from 'nativewind';
import { useRef } from 'react';
import { Text, View } from 'react-native';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SharedValue } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ConfirmActionBottomSheet } from '../../../@generic/component/confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { HorizontalCell } from '../../../@generic/component/horizontal-cell/horizontal-cell';
import { Icon } from '../../../@generic/component/icon/icon';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useConfirmAction } from '../../../settings/hook/use-confirm-action.hook';
import { BudgetRowSwipeActions } from '../budget-row-swipe-actions/budget-row-swipe-actions';

interface Props {
    readonly template: BudgetTemplateEntityInterface;
    readonly onPress: () => void;
    readonly onDelete: () => Promise<void>;
}

const BUDGET_PERIOD_LABELS: Record<BudgetPeriodEnum, MessageDescriptor> = {
    [BudgetPeriodEnum.WEEKLY]: msg`Weekly`,
    [BudgetPeriodEnum.BI_WEEKLY]: msg`Bi-Weekly`,
    [BudgetPeriodEnum.MONTHLY]: msg`Monthly`
};

const Swipeable = styled(ReanimatedSwipeable, { containerClassName: 'containerStyle' });

const getCategoryCount = (categoryLimitsJson: string | null): number => {
    if (!isDefined(categoryLimitsJson)) {
        return 0;
    }

    const parsed = JSON.parse(categoryLimitsJson);

    return Array.isArray(parsed) ? parsed.length : 0;
};

export const BudgetTemplateRow = ({ template, onPress, onDelete }: Props) => {
    const { i18n, t } = useLingui();

    const swipeableRef = useRef<SwipeableMethods>(null);

    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatMoney = useFormatDigits(decimalPlaces);

    const handleCancel = () => void swipeableRef.current?.close();

    const { isLoading, handleOpen, handleConfirm, ref: confirmRef } = useConfirmAction(onDelete);

    const periodLabel = i18n.t(BUDGET_PERIOD_LABELS[template.period]);
    const overallLimit = formatMoney(convertFromMicroUnits(template.overallLimit), defaultInstrument.symbol);
    const categoryCount = getCategoryCount(template.categoryLimitsJson);
    const description = t`${periodLabel} • ${overallLimit} • ${categoryCount} categories`;

    const renderRightActions = (_: SharedValue<number>, drag: SharedValue<number>) => (
        <BudgetRowSwipeActions drag={drag} onDeletePress={handleOpen} />
    );

    return (
        <>
            <Swipeable
                ref={swipeableRef}
                friction={2}
                enableTrackpadTwoFingerGesture
                rightThreshold={40}
                renderRightActions={renderRightActions}
            >
                <HorizontalCell
                    onPress={onPress}
                    left={<CircleIcon icon={UserIconNameEnum.FileText} variant="primary" size={42} iconSize={20} />}
                    right={<Icon className="text-secondary-foreground" icon={UserIconNameEnum.ChevronRight} size={16} />}
                >
                    <Text className="text-primary font-medium">{template.name}</Text>
                    <View className="mt-1">
                        <Text className="text-secondary-foreground text-sm">{description}</Text>
                    </View>
                </HorizontalCell>
            </Swipeable>

            <ConfirmActionBottomSheet
                ref={confirmRef}
                variant="destructive"
                description={t`This will permanently delete the template "${template.name}". This cannot be undone.`}
                isLoading={isLoading}
                onCancel={handleCancel}
                buttonText={t`Delete`}
                onSubmit={handleConfirm}
                icon={UserIconNameEnum.Trash}
                title={t`Delete Template`}
            />
        </>
    );
};
