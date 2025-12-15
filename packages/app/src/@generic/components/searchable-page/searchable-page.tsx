import { ComponentProps } from 'react';
import { TextInput } from 'react-native';

import { EmptyFn, isNotEmptyArray } from '@rnw-community/shared';

import { IconName } from '../../constant/icons.constant';
import { IdInterface } from '../../interface/id.interface';
import { Page } from '../page/page';
import { PageHeader } from '../page-header/page-header';
import { SearchablePageCreate } from '../searchable-page-create/searchable-page-create';
import { SearchablePageList } from '../searchable-page-list/searchable-page-list';
import { SearchablePageEmptyState } from '../searchagle-page-empty-state/searchagle-page-empty-state';

interface Props<T extends IdInterface> extends Omit<ComponentProps<typeof SearchablePageList<T>>, 'data'> {
    title: string;
    search: string;
    data: T[] | null;
    onGoBack: EmptyFn;
    searchPlaceholder: string;
    emptyStateTitle: string;
    emptyStateDescription: string;
    emptyStateIcon: IconName;
    onSearchChange: (search: string) => void;
}

export const SearchablePage = <T extends IdInterface>({
    data,
    onDelete,
    search,
    title,
    renderCard,
    renderBottomSheet,
    searchPlaceholder,
    onSearchChange,
    emptyStateTitle,
    emptyStateIcon,
    emptyStateDescription,
    onGoBack
}: Props<T>) => (
    <Page
        header={
            <PageHeader
                onGoBack={onGoBack}
                title={title}
                bottom={
                    <TextInput
                        value={search}
                        onChangeText={onSearchChange}
                        placeholder={searchPlaceholder}
                        className="text-primary placeholder:text-secondary-foreground h-[44px] px-xl bg-secondary-background rounded-5xl border border-secondary-corner"
                    />
                }
            />
        }
    >
        {isNotEmptyArray(data) ? (
            <SearchablePageList onDelete={onDelete} data={data} renderCard={renderCard} renderBottomSheet={renderBottomSheet} />
        ) : (
            <SearchablePageEmptyState title={emptyStateTitle} icon={emptyStateIcon} description={emptyStateDescription} />
        )}

        <SearchablePageCreate renderBottomSheet={renderBottomSheet} />
    </Page>
);
