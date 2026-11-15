import { View } from 'react-native';

import { GroupedListSection } from '../grouped-list-section/grouped-list-section';
import { SheetSurface } from '../sheet-surface/sheet-surface';
import { SheetTitleRow } from '../sheet-title-row/sheet-title-row';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly children: ReactNode;
}

export const SelectorSheetList = ({ title, children }: Props) => (
    <SheetSurface className="flex-none pt-lg" contentClassName="flex-none">
        <View className="px-xl pb-lg">
            <SheetTitleRow title={title} />
        </View>
        <View className="px-3xl pb-xl">
            <GroupedListSection>{children}</GroupedListSection>
        </View>
    </SheetSurface>
);
