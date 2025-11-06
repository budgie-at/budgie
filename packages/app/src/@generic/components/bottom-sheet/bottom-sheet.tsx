import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { styled } from 'nativewind';
import React from 'react';
import { Edges, SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheetSnapPoints } from '../../type/bottom-sheet-snap-points.type';
import { cn } from '../../utils/cn.util';

import { BottomSheetBackdrop } from './bottom-sheet-backdrop';

import type { PropsWithChildren, Ref } from 'react';

interface Props {
    readonly className?: string;
    readonly handleClassName?: string;
    readonly contentClassName?: string;
    readonly ref: Ref<BottomSheetModal>;
    readonly snapPoints?: BottomSheetSnapPoints;
}

const Modal = styled(BottomSheetModal, {
    className: 'style',
    handleClassName: 'handleStyle',
    backgroundClassName: 'backgroundStyle',
    handleIndicatorClassName: 'handleIndicatorStyle'
});

const Content = styled(BottomSheetView);
const edges: Edges = ['bottom'];

export const BottomSheet = ({ ref, children, className, snapPoints = [], handleClassName, contentClassName }: PropsWithChildren<Props>) => (
    <Modal
        backdropComponent={BottomSheetBackdrop}
        backgroundClassName="bg-primary-reverse"
        className={cn('shadow-primary shadow-2xl rounded-t-3xl', className)}
        enablePanDownToClose
        handleClassName={cn('bg-primary-reverse rounded-t-3xl', handleClassName)}
        handleIndicatorClassName="bg-primary"
        enableDynamicSizing={false}
        ref={ref}
        snapPoints={snapPoints}
    >
        <Content className={cn('bg-primary-reverse pt-4 px-6 pb-6', contentClassName)}>
            <SafeAreaView edges={edges}>{children}</SafeAreaView>
        </Content>
    </Modal>
);
