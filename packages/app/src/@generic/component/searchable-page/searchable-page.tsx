import { ReactNode } from 'react';
import { View } from 'react-native';

import { CollapsibleHeaderBackdrop, ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';
import { EmptyFn } from '@rnw-community/shared';

import { STACKED_TITLE_CHROME_CONFIG } from '../../constant/stacked-title-chrome-config.constant';
import { ScreenChromeThemeProvider } from '../../provider/screen-chrome-theme.provider';
import { CollapsibleChromeHeader } from '../collapsible-chrome-header/collapsible-chrome-header';
import { GoBackButton } from '../go-back-button/go-back-button';
import { SearchablePageSearchInput } from '../searchable-page-search-input/searchable-page-search-input';
import { StackedLargeTitle } from '../stacked-large-title/stacked-large-title';
import { StackedSmallTitle } from '../stacked-small-title/stacked-small-title';

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

    return (
        <View className="flex-1">
            <ScreenChromeThemeProvider config={STACKED_TITLE_CHROME_CONFIG}>
                <ScreenChromeFrame>
                    <View className="flex-1 px-5xl" testID={testID}>
                        {children}
                    </View>

                    <CollapsibleHeaderBackdrop />

                    <CollapsibleChromeHeader
                        leading={<GoBackButton onPress={onGoBack} />}
                        expandedTitle={<StackedLargeTitle title={title} />}
                        collapsedTitle={<StackedSmallTitle title={title} />}
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
