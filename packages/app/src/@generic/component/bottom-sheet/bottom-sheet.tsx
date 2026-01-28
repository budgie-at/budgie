import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { styled } from 'nativewind';
import React, { FC, Ref, useImperativeHandle, useRef } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';

import { cn } from '../../utils/cn.util';
import { BottomSheetCloseableBackdrop } from '../bottom-sheet-closeable-backdrop/bottom-sheet-closeable-backdrop';
import { BottomSheetNonCloseableBackdrop } from '../bottom-sheet-non-closeable-backdrop/bottom-sheet-non-closeable-backdrop';

import type { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import type { BottomSheetFooterProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetFooter';
import type { ComponentProps, PropsWithChildren } from 'react';

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

const isIOS = Platform.OS === 'ios';

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

    useImperativeHandle(
        ref,
        (): BottomSheetInterface => ({
            open: () => void modalRef.current?.present(),
            close: () => void modalRef.current?.close(),
            dismiss: () => void modalRef.current?.dismiss()
        })
    );

    const backdropComponent = isCloseable ? BottomSheetCloseableBackdrop : BottomSheetNonCloseableBackdrop;

    const renderContainerComponent = (containerProps: PropsWithChildren) =>
        isIOS ? <FullWindowOverlay>{containerProps.children}</FullWindowOverlay> : <>{containerProps.children}</>;

    return (
        <Modal
            className={cn('shadow-primary shadow-2xl rounded-t-3xl', className)}
            handleClassName={cn('bg-primary-reverse rounded-t-3xl', handleClassName)}
            enableDynamicSizing={enableDynamicSizing}
            backgroundClassName="bg-primary-reverse"
            backdropComponent={backdropComponent}
            handleIndicatorClassName="bg-primary"
            footerComponent={footerComponent}
            enableContentPanningGesture
            snapPoints={snapPoints}
            stackBehavior="push"
            enablePanDownToClose={isCloseable}
            ref={modalRef}
            topInset={top}
            index={index}
            {...rest}
            containerComponent={renderContainerComponent}
        >
            {children}
        </Modal>
    );
};
