import { useLingui } from '@lingui/react/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { EmptyState } from '../empty-state/empty-state';
import { LoadingContent } from '../loading-content/loading-content';
import { SearchablePageErrorState } from '../searchable-page-error-state/searchable-page-error-state';
import { SelectorSearchEmptyState } from '../selector-search-empty-state/selector-search-empty-state';

interface Props {
    readonly query: string;
    readonly isFailure: boolean;
    readonly isLoading: boolean;
    readonly onRetry: () => void;
}

export const IconSelectorEmptyState = ({ query, isFailure, isLoading, onRetry }: Props) => {
    const { t } = useLingui();

    if (isFailure) {
        return <SearchablePageErrorState onRetry={onRetry} />;
    }

    const emptyState = isNotEmptyString(query) ? (
        <SelectorSearchEmptyState query={query} hint={t`Try a simpler word like “car” or “food”.`} />
    ) : (
        <EmptyState title={t`No icons found`} description="" />
    );

    return <LoadingContent isLoading={isLoading}>{emptyState}</LoadingContent>;
};
