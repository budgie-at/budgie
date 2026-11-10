import { GROUPED_LIST_SIZING } from '../../constant/grouped-list-sizing.constant';
import { SearchablePageErrorState } from '../searchable-page-error-state/searchable-page-error-state';
import { SearchablePageList } from '../searchable-page-list/searchable-page-list';

import type { IdInterface } from '../../interface/id.interface';
import type { ReactElement, ReactNode } from 'react';

interface Props<T extends IdInterface> {
    readonly data: T[] | null;
    readonly isFailure: boolean;
    readonly onRetry: () => void;
    readonly emptyState: ReactNode;
    readonly renderCard: (item: T, index: number, isLast: boolean) => ReactNode;
    readonly listHeader: ReactElement;
    readonly listFooter?: ReactElement;
}

const NO_ITEMS: never[] = [];

export const EntitySearchableList = <T extends IdInterface>(props: Props<T>) => {
    const { data, isFailure, onRetry, emptyState, renderCard, listHeader, listFooter } = props;
    const listData = isFailure ? NO_ITEMS : data;
    const visibleEmptyState = isFailure ? <SearchablePageErrorState onRetry={onRetry} /> : emptyState;

    return (
        <SearchablePageList
            data={listData}
            emptyState={visibleEmptyState}
            renderCard={renderCard}
            listHeader={listHeader}
            listFooter={listFooter}
            sizing={GROUPED_LIST_SIZING}
        />
    );
};
