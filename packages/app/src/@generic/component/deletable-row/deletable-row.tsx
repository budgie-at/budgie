import { useLingui } from '@lingui/react/macro';
import { ReactNode, useRef, useState } from 'react';
import { Alert } from 'react-native';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SharedValue } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { DeletableRowAction } from './deletable-row-action';

import type { DeletableRowVariant } from '../../type/deletable-row-variant.type';

interface Props {
    readonly onDelete: (id: number) => void;
    readonly children: ReactNode;
    readonly id: number;
    readonly confirmation?: DeleteConfirmation;
    readonly label?: string;
    readonly isDisabled?: boolean;
    readonly variant?: DeletableRowVariant;
}

export interface DeleteConfirmation {
    readonly title?: string;
    readonly description?: string;
    readonly buttonText?: string;
}

export const DeletableRow = ({ children, onDelete, id, confirmation, label, isDisabled = false, variant = 'pill' }: Props) => {
    const ref = useRef<SwipeableMethods>(null);
    const { t } = useLingui();

    const [isOpen, setIsOpen] = useState(false);
    const actionLabel = label ?? t`Delete`;

    const handleOpen = () => void setIsOpen(true);
    const handleClose = () => void setIsOpen(false);

    const handleDelete = () => void onDelete(id);

    const confirm = () => {
        if (!isDefined(confirmation)) {
            ref.current?.close();
            handleDelete();

            return;
        }

        Alert.alert(confirmation.title ?? t`Are you sure?`, confirmation.description ?? t`This action cannot be undone.`, [
            { text: confirmation.buttonText ?? t`Delete`, onPress: handleDelete, style: 'destructive' },
            { text: t`Cancel`, style: 'cancel', onPress: () => ref.current?.close() }
        ]);
    };

    const renderRightActions = (_: SharedValue<number>, drag: SharedValue<number>) => (
        <DeletableRowAction drag={drag} isOpen={isOpen} label={actionLabel} variant={variant} onPress={confirm} />
    );

    return (
        <ReanimatedSwipeable
            ref={ref}
            enabled={!isDisabled}
            friction={2}
            enableTrackpadTwoFingerGesture
            rightThreshold={40}
            renderRightActions={renderRightActions}
            onSwipeableOpen={handleOpen}
            onSwipeableClose={handleClose}
        >
            {children}
        </ReanimatedSwipeable>
    );
};
