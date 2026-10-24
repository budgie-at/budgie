import { ReactNode } from 'react';
import { Modal, View } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

interface Props {
    readonly children: ReactNode;
}

export const AppLockOverlay = ({ children }: Props) => (
    <Modal visible onRequestClose={emptyFn}>
        <View className="flex-1 bg-primary-reverse">{children}</View>
    </Modal>
);
