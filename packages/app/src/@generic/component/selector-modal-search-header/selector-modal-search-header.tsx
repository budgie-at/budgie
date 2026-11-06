import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { SelectorSearchRow } from '../selector-search-row/selector-search-row';
import { SheetTitleRow } from '../sheet-title-row/sheet-title-row';

import type { ReactNode } from 'react';

interface Props {
    readonly search: string;
    readonly onSearchChange: (value: string) => void;
    readonly title: string;
    readonly placeholder?: string;
    readonly trailing?: ReactNode;
    readonly testID?: string;
}

export const SelectorModalSearchHeader = (props: Props) => {
    const { search, onSearchChange, title, placeholder, trailing, testID } = props;
    const { t } = useLingui();

    const resolvedPlaceholder = placeholder ?? t`Search…`;

    return (
        <View collapsable={false} className="px-3xl pb-md pt-md bg-surface">
            <View className="pb-[10px]">
                <SheetTitleRow title={title} trailing={trailing} />
            </View>
            <SelectorSearchRow search={search} onSearchChange={onSearchChange} placeholder={resolvedPlaceholder} testID={testID} />
        </View>
    );
};
