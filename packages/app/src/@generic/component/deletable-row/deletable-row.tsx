import { useLingui } from '@lingui/react/macro';
import { styled } from 'nativewind';
import { ReactNode, useRef } from 'react';
import { Alert } from 'react-native';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SharedValue } from 'react-native-reanimated';

import { DeletableRowAction } from './deletable-row-action';

interface Props {
    readonly onDelete: (id: number) => void;
    readonly children: ReactNode;
    readonly id: number;
    readonly confirmation?: DeleteConfirmation;
}

export interface DeleteConfirmation {
    readonly title?: string;
    readonly description?: string;
    readonly buttonText?: string;
}

const Swipable = styled(ReanimatedSwipeable, { containerClassName: 'containerStyle' });

export const DeletableRow = ({ children, onDelete, id, confirmation }: Props) => {
    const ref = useRef<SwipeableMethods>(null);
    const { t } = useLingui();

    const confirmTitle = confirmation?.title ?? t`Are you sure?`;
    const confirmDescription = confirmation?.description ?? t`This action cannot be undone.`;
    const confirmButtonText = confirmation?.buttonText ?? t`Delete`;

    const confirm = () =>
        void Alert.alert(confirmTitle, confirmDescription, [
            {
                text: confirmButtonText,
                onPress: () => void onDelete(id),
                style: 'destructive'
            },
            {
                text: t`Cancel`,
                style: 'cancel',
                onPress: () => ref.current?.close()
            }
        ]);

    const renderRightActions = (_: SharedValue<number>, drag: SharedValue<number>) => <DeletableRowAction drag={drag} onPress={confirm} />;

    return (
        <Swipable ref={ref} friction={2} enableTrackpadTwoFingerGesture rightThreshold={40} renderRightActions={renderRightActions}>
            {children}
        </Swipable>
    );
};
