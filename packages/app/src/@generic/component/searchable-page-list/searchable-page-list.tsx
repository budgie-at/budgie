import { ReactNode } from 'react';

import { IdInterface } from '../../interface/id.interface';
import { AnimatedFlatList } from '../animated-flat-list/animated-flat-list';
import { MenuSpacer } from '../menu-spacer/menu-spacer';

interface Props<T extends IdInterface> {
    readonly data: T[];
    readonly onDelete: (id: number) => Promise<void>;
    readonly renderCard: (item: T, onOpen: (item: T) => void) => ReactNode;
    readonly children?: ReactNode;
}

const keyExtractor = (item: IdInterface) => item.id.toString();

export const SearchablePageList = <T extends IdInterface>({ data, children, renderCard }: Props<T>) => {
    const renderItem = (item: T) => renderCard(item);

    return (
        <>
            <AnimatedFlatList
                className="flex-1"
                data={data}
                contentContainerClassName="gap-y-5xl pt-5xl"
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                ListFooterComponent={MenuSpacer}
            />

            {children}
        </>
    );
};
