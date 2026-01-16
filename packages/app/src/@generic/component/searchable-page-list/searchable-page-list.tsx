import { ReactNode } from 'react';

import { IdInterface } from '../../interface/id.interface';
import { AnimatedFlatList } from '../animated-flat-list/animated-flat-list';
import { MenuSpacer } from '../menu-spacer/menu-spacer';

interface Props<T extends IdInterface> {
    readonly data: T[];
    readonly renderCard: (item: T) => ReactNode;
    readonly children?: ReactNode;
}

const keyExtractor = (item: IdInterface) => item.id.toString();

export const SearchablePageList = <T extends IdInterface>({ data, children, renderCard }: Props<T>) => (
    <>
        <AnimatedFlatList
            className="flex-1"
            data={data}
            contentContainerClassName="gap-y-5xl pt-5xl"
            renderItem={renderCard}
            keyExtractor={keyExtractor}
            ListFooterComponent={MenuSpacer}
        />

        {children}
    </>
);
