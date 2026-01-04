import { UserIconNameEnum } from '@budgie/contracts';
import { ComponentProps } from 'react';
import { TextInput } from 'react-native';

import { EmptyFn, isNotEmptyArray } from '@rnw-community/shared';

import { IdInterface } from '../../interface/id.interface';
import { FloatingAddButton } from '../floating-add-button/floating-add-button';
import { Page } from '../page/page';
import { PageHeader } from '../page-header/page-header';
import { SearchablePageList } from '../searchable-page-list/searchable-page-list';
import { SearchablePageEmptyState } from '../searchagle-page-empty-state/searchagle-page-empty-state';

interface Props<T extends IdInterface> extends Omit<ComponentProps<typeof SearchablePageList<T>>, 'data'> {
    readonly title: string;
    readonly search: string;
    readonly data: T[] | null;
    readonly onGoBack: EmptyFn;
    readonly searchPlaceholder: string;
    readonly emptyStateTitle: string;
    readonly emptyStateDescription: string;
    readonly emptyStateIcon: UserIconNameEnum;
    readonly onSearchChange: (search: string) => void;
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

        <FloatingAddButton renderBottomSheet={renderBottomSheet} />
    </Page>
);
