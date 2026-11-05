import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { SelectorSearchRow } from '../selector-search-row/selector-search-row';
import { SheetSurface } from '../sheet-surface/sheet-surface';
import { SheetTitleRow } from '../sheet-title-row/sheet-title-row';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly description: string | undefined;
    readonly search: string;
    readonly onSearchChange: (value: string) => void;
    readonly placeholder: string;
    readonly searchTestID?: string;
    readonly action: ReactNode;
    readonly children: ReactNode;
}

export const DestinationSheet = (props: Props) => {
    const { title, description, search, onSearchChange, placeholder, searchTestID, action, children } = props;

    return (
        <SheetSurface>
            <View className="gap-y-md px-3xl pt-7xl pb-xl">
                <SheetTitleRow title={title} />
                {isNotEmptyString(description) ? (
                    <Text className="text-secondary-foreground px-3xl text-center text-[15px] leading-[20px]">{description}</Text>
                ) : null}
            </View>
            <View className="px-xl pb-lg">
                <SelectorSearchRow search={search} onSearchChange={onSearchChange} placeholder={placeholder} testID={searchTestID}>
                    {action}
                </SelectorSearchRow>
            </View>
            {children}
        </SheetSurface>
    );
};
