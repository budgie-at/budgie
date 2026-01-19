/* jscpd:ignore-start */
import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { styled } from 'nativewind';
import { useRef } from 'react';
import { Text, View } from 'react-native';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SharedValue } from 'react-native-reanimated';

import { EmptyFn } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ConfirmActionBottomSheet } from '../../../@generic/component/confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { HorizontalCell } from '../../../@generic/component/horizontal-cell/horizontal-cell';
import { Icon } from '../../../@generic/component/icon/icon';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useConfirmAction } from '../../../settings/hook/use-confirm-action.hook';
import { BudgetRowSwipeActions } from '../budget-row-swipe-actions/budget-row-swipe-actions';

interface Props {
    readonly category: CategoryEntityInterface;
    readonly limit: number;
    readonly onEdit: EmptyFn;
    readonly onRemove: EmptyFn;
}

const Swipeable = styled(ReanimatedSwipeable, { containerClassName: 'containerStyle' });

export const BudgetCategoryLimitRow = ({ category, limit, onEdit, onRemove }: Props) => {
    const { t } = useLingui();

    const swipeableRef = useRef<SwipeableMethods>(null);

    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatMoney = useFormatDigits(decimalPlaces);

    const handleCancel = () => void swipeableRef.current?.close();

    const { isLoading, handleOpen, handleConfirm, ref: confirmRef } = useConfirmAction(onRemove);

    const formattedLimit = formatMoney(limit, defaultInstrument.symbol);
    const categoryTitle = category.title;
    const confirmDescription = t`This will remove the budget limit for "${categoryTitle}". The category itself will not be deleted.`;

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
                    onPress={onEdit}
                    left={<CircleIcon icon={category.icon} variant="default" size={42} iconSize={20} />}
                    right={
                        <View className="ml-auto flex-row items-center gap-x-sm">
                            <Text className="text-secondary-foreground font-medium">{formattedLimit}</Text>
                            <Icon className="text-secondary-foreground" icon={UserIconNameEnum.ChevronRight} size={16} />
                        </View>
                    }
                >
                    <Text className="text-primary font-medium">{category.title}</Text>
                </HorizontalCell>
            </Swipeable>

            <ConfirmActionBottomSheet
                ref={confirmRef}
                variant="destructive"
                description={confirmDescription}
                isLoading={isLoading}
                onCancel={handleCancel}
                buttonText={t`Remove`}
                onSubmit={handleConfirm}
                icon={UserIconNameEnum.Info}
                title={t`Remove Budget Limit`}
            />
        </>
    );
};
/* jscpd:ignore-end */
