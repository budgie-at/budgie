import { BottomSheetFooterProps } from '@gorhom/bottom-sheet';

import { EmptyFn } from '@rnw-community/shared';

import { MultiSelectFooter } from '../../../@generic/component/multi-select-footer/multi-select-footer';

interface Props extends BottomSheetFooterProps {
    readonly selectedTagsCount: number;
    readonly onClose: EmptyFn;
    readonly onClear: EmptyFn;
}

export const TagsSelectorFooter = ({ selectedTagsCount, onClose, onClear, animatedFooterPosition }: Props) => (
    <MultiSelectFooter
        animatedFooterPosition={animatedFooterPosition}
        selectedCount={selectedTagsCount}
        onClose={onClose}
        onClear={onClear}
    />
);
