import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { styled } from 'nativewind';
import React, { ComponentProps, PropsWithChildren, Ref, useImperativeHandle, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '../../utils/cn.util';
import { BottomSheetBackdrop } from '../bottom-sheet-backdrop/bottom-sheet-backdrop';

import type { BottomSheetInterface } from '../../interface/bottom-sheet.interface';

interface Props extends Omit<ComponentProps<typeof BottomSheetModal>, 'ref'> {
    readonly index?: number;
    readonly className?: string;
    readonly handleClassName?: string;
    readonly ref: Ref<BottomSheetInterface | null>;
}

const Modal = styled(BottomSheetModal, {
    className: 'style',
    handleClassName: 'handleStyle',
    backgroundClassName: 'backgroundStyle',
    handleIndicatorClassName: 'handleIndicatorStyle'
});

export const BottomSheet = ({
    ref,
    index,
    children,
    className,
    snapPoints,
    handleClassName,
    enableDynamicSizing,
    ...rest
}: PropsWithChildren<Props>) => {
    const modalRef = useRef<BottomSheetModal | null>(null);
    const { top } = useSafeAreaInsets();

    const open = () => void modalRef.current?.present();
    const close = () => void modalRef.current?.close();

    useImperativeHandle(ref, (): BottomSheetInterface => ({ open, close }));

    return (
        <Modal
            className={cn('shadow-primary shadow-2xl rounded-t-3xl', className)}
            handleClassName={cn('bg-primary-reverse rounded-t-3xl', handleClassName)}
            enableDynamicSizing={enableDynamicSizing}
            backgroundClassName="bg-primary-reverse"
            backdropComponent={BottomSheetBackdrop}
            handleIndicatorClassName="bg-primary"
            snapPoints={snapPoints}
            enablePanDownToClose
            ref={modalRef}
            topInset={top}
            index={index}
            {...rest}
        >
            {children}
        </Modal>
    );
};
