import { ComponentProps, RefObject, useCallback } from 'react';

import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { IdInterface } from '../../interface/id.interface';
import { FloatingActionButton } from '../floating-action-button/floating-action-button';
import { SearchablePageList } from '../searchable-page-list/searchable-page-list';

export const SearchablePageCreate = <T extends IdInterface>({
    renderBottomSheet
}: Pick<ComponentProps<typeof SearchablePageList<T>>, 'renderBottomSheet'>) => {
    const renderBottomSheetCallback = useCallback(
        (ref: RefObject<BottomSheetInterface | null>) => renderBottomSheet(null, ref),
        [renderBottomSheet]
    );

    return <FloatingActionButton renderBottomSheet={renderBottomSheetCallback} />;
};
