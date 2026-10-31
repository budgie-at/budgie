import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { SelectorSearchRow } from '../selector-search-row/selector-search-row';

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
        <View className="flex-1 bg-primary-reverse" collapsable={false}>
            <View className="gap-y-xs px-3xl pt-4xl pb-xl">
                <Text className="text-primary text-[20px] font-semibold leading-[25px]" accessibilityRole="header">
                    {title}
                </Text>
                {isNotEmptyString(description) ? (
                    <Text className="text-secondary-foreground text-[15px] leading-[20px]">{description}</Text>
                ) : null}
            </View>
            <View className="px-xl pb-lg">
                <SelectorSearchRow search={search} onSearchChange={onSearchChange} placeholder={placeholder} testID={searchTestID}>
                    {action}
                </SelectorSearchRow>
            </View>
            {children}
        </View>
    );
};
