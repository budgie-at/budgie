import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { CollapsibleHeaderBackdrop, ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';
import { EmptyFn } from '@rnw-community/shared';

import { ScreenChromeThemeProvider } from '../../provider/screen-chrome-theme.provider';
import { CollapsibleChromeHeaderScrim } from '../collapsible-chrome-header-scrim/collapsible-chrome-header-scrim';
import { CollapsibleChromeHeader } from '../collapsible-chrome-header/collapsible-chrome-header';
import { GoBackButton } from '../go-back-button/go-back-button';
import { SearchablePageSearchInput } from '../searchable-page-search-input/searchable-page-search-input';

interface Props {
    readonly title: string;
    readonly onGoBack: EmptyFn;
    readonly search: string;
    readonly searchPlaceholder: string;
    readonly onSearchChange: (search: string) => void;
    readonly searchInputTestID?: string;
    readonly testID?: string;
    readonly children: ReactNode;
}

export const SearchablePage = (props: Props) => {
    const { title, onGoBack, search, searchPlaceholder, onSearchChange, searchInputTestID, testID, children } = props;
    const largeTitleLayer = (
        <Text className="text-primary font-medium text-3xl" numberOfLines={1}>
            {title}
        </Text>
    );
    const smallTitleLayer = (
        <Text className="text-primary text-lg font-semibold text-center" numberOfLines={1}>
            {title}
        </Text>
    );

    return (
        <View className="flex-1">
            <ScreenChromeThemeProvider>
                <ScreenChromeFrame>
                    <View className="flex-1 px-5xl" testID={testID}>
                        {children}
                    </View>

                    <CollapsibleHeaderBackdrop />

                    <CollapsibleChromeHeaderScrim />

                    <CollapsibleChromeHeader
                        leading={<GoBackButton onPress={onGoBack} />}
                        expandedTitle={largeTitleLayer}
                        collapsedTitle={smallTitleLayer}
                    />
                </ScreenChromeFrame>
            </ScreenChromeThemeProvider>

            <SearchablePageSearchInput
                search={search}
                placeholder={searchPlaceholder}
                onSearchChange={onSearchChange}
                testID={searchInputTestID}
            />
        </View>
    );
};
