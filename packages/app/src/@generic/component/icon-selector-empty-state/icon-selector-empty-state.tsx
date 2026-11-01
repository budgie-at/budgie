import { useLingui } from '@lingui/react/macro';

import { EmptyState } from '../empty-state/empty-state';
import { LoadingContent } from '../loading-content/loading-content';
import { SearchablePageErrorState } from '../searchable-page-error-state/searchable-page-error-state';

interface Props {
    readonly isFailure: boolean;
    readonly isLoading: boolean;
    readonly onRetry: () => void;
}

export const IconSelectorEmptyState = ({ isFailure, isLoading, onRetry }: Props) => {
    const { t } = useLingui();

    if (isFailure) {
        return <SearchablePageErrorState onRetry={onRetry} />;
    }

    return (
        <LoadingContent isLoading={isLoading}>
            <EmptyState title={t`No icons found`} description={t`Try a different search term`} />
        </LoadingContent>
    );
};
