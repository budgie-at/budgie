import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { styled } from 'nativewind';
import { ReactNode, useRef } from 'react';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SharedValue } from 'react-native-reanimated';

import { useConfirmAction } from '../../../settings/hook/use-confirm-action.hook';
import { ConfirmActionBottomSheet } from '../confirm-action-bottom-sheet/confirm-action-bottom-sheet';

import { DeletableRowAction } from './deletable-row-action';

interface Props {
    readonly deleteConfirmDescription: string;
    readonly onDelete: (id: number) => void;
    readonly deleteConfirmTitle: string;
    readonly children: ReactNode;
    readonly id: number;
}

const Swipable = styled(ReanimatedSwipeable, { containerClassName: 'containerStyle' });

export const DeletableRow = ({ children, onDelete, id, deleteConfirmTitle, deleteConfirmDescription }: Props) => {
    const ref = useRef<SwipeableMethods>(null);
    const handleCancel = () => void ref.current?.close();
    const onConfirm = () => void onDelete(id);

    const { isLoading, handleOpen, handleConfirm, ref: confirmRef } = useConfirmAction(onConfirm);
    const { t } = useLingui();

    const renderRightActions = (_: SharedValue<number>, drag: SharedValue<number>) => (
        <DeletableRowAction drag={drag} onPress={handleOpen} />
    );

    return (
        <>
            <Swipable ref={ref} friction={2} enableTrackpadTwoFingerGesture rightThreshold={40} renderRightActions={renderRightActions}>
                {children}
            </Swipable>

            <ConfirmActionBottomSheet
                ref={confirmRef}
                variant="destructive"
                description={deleteConfirmDescription}
                isLoading={isLoading}
                onCancel={handleCancel}
                buttonText={t`Delete`}
                onSubmit={handleConfirm}
                icon={UserIconNameEnum.Info}
                title={deleteConfirmTitle}
            />
        </>
    );
};
