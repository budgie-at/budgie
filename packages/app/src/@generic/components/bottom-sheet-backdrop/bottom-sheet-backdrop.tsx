import { type BottomSheetBackdropProps, BottomSheetBackdrop as GorhomBottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { styled } from 'nativewind';
import React from 'react';

const Backdrop = styled(GorhomBottomSheetBackdrop, { className: 'style' });

export const BottomSheetBackdrop = (props: BottomSheetBackdropProps) => (
    <Backdrop {...props} appearsOnIndex={0} className="bg-black" disappearsOnIndex={-1} enableTouchThrough={false} opacity={0.5} />
);
