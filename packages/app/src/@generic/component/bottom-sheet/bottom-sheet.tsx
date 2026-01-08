import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { styled } from 'nativewind';
import React, { ComponentProps, FC, Ref, useImperativeHandle, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '../../utils/cn.util';
import { BottomSheetBackdrop } from '../bottom-sheet-backdrop/bottom-sheet-backdrop';

import type { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import type { BottomSheetFooterProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetFooter';

interface Props extends Omit<ComponentProps<typeof BottomSheetModal>, 'ref' | 'enablePanDownToClose'> {
    readonly index?: number;
    readonly className?: string;
    readonly handleClassName?: string;
    readonly useBottomSheetView?: boolean;
    readonly ref: Ref<BottomSheetInterface | null>;
    readonly footerComponent?: FC<BottomSheetFooterProps>;
    readonly isCloseable?: boolean;
    readonly children: React.ReactNode;
}

const Modal = styled(BottomSheetModal, {
    className: 'style',
    handleClassName: 'handleStyle',
    backgroundClassName: 'backgroundStyle',
    handleIndicatorClassName: 'handleIndicatorStyle'
});

export const BottomSheet = (props: Props) => {
    const {
        ref,
        index,
        children,
        className,
        snapPoints,
        handleClassName,
        footerComponent,
        enableDynamicSizing = false,
        isCloseable = true,
        ...rest
    } = props;

    const modalRef = useRef<BottomSheetModal | null>(null);
    const { top } = useSafeAreaInsets();

    const close = () => void modalRef.current?.close();
    const open = () => void modalRef.current?.present();
    const dismiss = () => void modalRef.current?.dismiss();

    useImperativeHandle(ref, (): BottomSheetInterface => ({ open, close, dismiss }));

    const backdropPressBehavior = isCloseable ? 'close' : 'none';
    const renderBackdrop = (backdropProps: ComponentProps<typeof BottomSheetBackdrop>) => (
        <BottomSheetBackdrop {...backdropProps} pressBehavior={backdropPressBehavior} />
    );

    return (
        <Modal
            className={cn('shadow-primary shadow-2xl rounded-t-3xl', className)}
            handleClassName={cn('bg-primary-reverse rounded-t-3xl', handleClassName)}
            enableDynamicSizing={enableDynamicSizing}
            backgroundClassName="bg-primary-reverse"
            backdropComponent={renderBackdrop}
            handleIndicatorClassName="bg-primary"
            footerComponent={footerComponent}
            enableContentPanningGesture
            snapPoints={snapPoints}
            stackBehavior="switch"
            enablePanDownToClose={isCloseable}
            ref={modalRef}
            topInset={top}
            index={index}
            {...rest}
        >
            {children}
        </Modal>
    );
};
