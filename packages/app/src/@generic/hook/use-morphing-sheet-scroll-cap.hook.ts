import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../constant/morphing-sheet-height-ratio.constant';

import { useMorphingSheetListHeight } from './use-morphing-sheet-list-height.hook';

export const useMorphingSheetScrollCap = () => {
    const { height } = useMorphingSheetListHeight(MORPHING_SHEET_SELECTOR_HEIGHT_RATIO);

    return { maxHeight: height, flexGrow: 0 };
};
