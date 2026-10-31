import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyFn, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useStickyDefinedValue } from '../../hook/use-sticky-defined-value.hook';
import { GroupedListSection } from '../grouped-list-section/grouped-list-section';
import { LoadingContent } from '../loading-content/loading-content';
import { SearchablePageErrorState } from '../searchable-page-error-state/searchable-page-error-state';

import type { DestinationSectionInterface } from '../../interface/destination-section.interface';
import type { IdInterface } from '../../interface/id.interface';
import type { ReactNode } from 'react';

interface Props<T extends IdInterface> {
    readonly sections: readonly DestinationSectionInterface<T>[] | null;
    readonly isFailure: boolean;
    readonly onRetry: EmptyFn;
    readonly emptyState: ReactNode;
    readonly renderRow: (item: T) => ReactNode;
}

export const DestinationList = <T extends IdInterface>({ sections, isFailure, onRetry, emptyState, renderRow }: Props<T>) => {
    const { bottom } = useSafeAreaInsets();
    const stickySections = useStickyDefinedValue(sections);
    const visibleSections = (stickySections ?? []).filter(section => isNotEmptyArray([...section.data]));
    const contentContainerStyle = { paddingBottom: bottom + 24 };

    if (isFailure) {
        return <SearchablePageErrorState onRetry={onRetry} />;
    }

    return (
        <ScrollView
            className="flex-1 px-xl"
            contentContainerClassName="gap-y-3xl"
            contentContainerStyle={contentContainerStyle}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
        >
            {isNotEmptyArray(visibleSections) ? (
                visibleSections.map(section => (
                    <GroupedListSection key={section.title} title={section.title}>
                        {section.data.map(renderRow)}
                    </GroupedListSection>
                ))
            ) : (
                <LoadingContent isLoading={!isDefined(stickySections)}>{emptyState}</LoadingContent>
            )}
        </ScrollView>
    );
};
