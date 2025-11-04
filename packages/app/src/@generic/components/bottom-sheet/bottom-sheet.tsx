import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { styled } from 'nativewind';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cn } from '../../utils/cn.util';

import { BottomSheetBackdrop } from './bottom-sheet-backdrop';

import type { PropsWithChildren, Ref } from 'react';

interface Props {
    readonly className?: string;
    readonly handleClassName?: string;
    readonly contentClassName?: string;
    readonly ref: Ref<BottomSheetModal>;
}

const Modal = styled(BottomSheetModal, {
    className: 'style',
    handleClassName: 'handleStyle',
    backgroundClassName: 'backgroundStyle',
    handleIndicatorClassName: 'handleIndicatorStyle'
});

const Content = styled(BottomSheetView);

export const BottomSheet = ({
    ref,
    children,
    className,
    handleClassName,
    contentClassName
}: PropsWithChildren<Props>) => (
    <Modal
        backdropComponent={BottomSheetBackdrop}
        backgroundClassName="bg-primary-reverse"
        className={cn('shadow-primary shadow-2xl rounded-t-3xl', className)}
        enablePanDownToClose
        handleClassName={cn('bg-primary-reverse rounded-t-3xl', handleClassName)}
        handleIndicatorClassName="bg-primary"
        ref={ref}
    >
        <Content className={cn('bg-primary-reverse pt-4 px-6 pb-6', contentClassName)}>
            <SafeAreaView edges={['bottom']}>{children}</SafeAreaView>
        </Content>
    </Modal>
);
