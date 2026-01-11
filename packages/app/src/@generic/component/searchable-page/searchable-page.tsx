import { ReactNode } from 'react';
import { TextInput } from 'react-native';

import { EmptyFn, isNotEmptyArray } from '@rnw-community/shared';

import { IdInterface } from '../../interface/id.interface';
import { Page } from '../page/page';
import { PageHeader } from '../page-header/page-header';
import { SearchablePageList } from '../searchable-page-list/searchable-page-list';

interface Props<T extends IdInterface> {
    title: string;
    search: string;
    data: T[] | null;
    onGoBack: EmptyFn;
    searchPlaceholder: string;
    emptyState: ReactNode;
    onSearchChange: (search: string) => void;
    onDelete: (id: number) => Promise<void>;
    renderCard: (item: T) => ReactNode;
    children?: ReactNode;
}

export const SearchablePage = <T extends IdInterface>({
    data,
    onDelete,
    search,
    title,
    renderCard,
    searchPlaceholder,
    onSearchChange,
    emptyState,
    onGoBack,
    children
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
            <SearchablePageList onDelete={onDelete} data={data} renderCard={renderCard}>
                {children}
            </SearchablePageList>
        ) : (
            emptyState
        )}
    </Page>
);
