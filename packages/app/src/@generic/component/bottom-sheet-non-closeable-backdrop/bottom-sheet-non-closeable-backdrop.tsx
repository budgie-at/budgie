import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';

import { BottomSheetBackdrop } from '../bottom-sheet-backdrop/bottom-sheet-backdrop';

export const BottomSheetNonCloseableBackdrop = (props: BottomSheetDefaultBackdropProps) => (
    <BottomSheetBackdrop {...props} pressBehavior="none" />
);
