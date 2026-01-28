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
    readonly deleteActionTestID?: string;
}

const Swipable = styled(ReanimatedSwipeable, { containerClassName: 'containerStyle' });

export const DeletableRow = ({ children, onDelete, id, deleteActionTestID }: Props) => {
    const ref = useRef<SwipeableMethods>(null);
    const { t } = useLingui();

    const confirm = () =>
        void Alert.alert(t`Are you sure?`, t`This action cannot be undone.`, [
            {
                text: t`Delete`,
                onPress: () => void onDelete(id),
                style: 'destructive'
            },
            {
                text: t`Cancel`,
                style: 'cancel',
                onPress: () => ref.current?.close()
            }
        ]);

    const renderRightActions = (_: SharedValue<number>, drag: SharedValue<number>) => (
        <DeletableRowAction testID={deleteActionTestID} drag={drag} onPress={confirm} />
    );

    return (
        <Swipable ref={ref} friction={2} enableTrackpadTwoFingerGesture rightThreshold={40} renderRightActions={renderRightActions}>
            {children}
        </Swipable>
    );
};
