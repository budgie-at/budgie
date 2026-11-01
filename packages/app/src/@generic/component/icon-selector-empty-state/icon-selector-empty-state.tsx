import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

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

    if (isNotEmptyString(query)) {
        return (
            <View className="pt-7xl">
                <SelectorSearchEmptyState query={query} hint={t`Try a simpler word like “car” or “food”.`} />
            </View>
        );
    }

    return (
        <LoadingContent isLoading={isLoading}>
            <EmptyState title={t`No icons found`} description={t`Try a different search term`} />
        </LoadingContent>
    );
};
