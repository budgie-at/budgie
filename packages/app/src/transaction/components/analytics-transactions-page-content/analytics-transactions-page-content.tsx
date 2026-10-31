import { Text, View } from 'react-native';

import { CollapsibleHeaderBackdrop, ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';

import { CollapsibleChromeHeaderScrim } from '../../../@generic/component/collapsible-chrome-header-scrim/collapsible-chrome-header-scrim';
import { CollapsibleChromeHeader } from '../../../@generic/component/collapsible-chrome-header/collapsible-chrome-header';
import { CollapsibleChromeLegendList } from '../../../@generic/component/collapsible-chrome-legend-list/collapsible-chrome-legend-list';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';
import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';
import { useTransactionFilterPageTitle } from '../../hook/use-transaction-filter-page-title.hook';
import { TransactionSectionsList } from '../transaction-sections-list/transaction-sections-list';

import type { TransactionFilterPageHeaderPropsInterface } from '../../interface/transaction-filter-page-header-props.interface';
import type { TransactionsByDaySectionInterface } from '../../interface/transactions-by-day-section.interface';
import type { ReactElement, ReactNode } from 'react';

interface Props {
    readonly headerProps: TransactionFilterPageHeaderPropsInterface;
    readonly summary?: ReactNode;
    readonly emptyState: ReactElement;
    readonly sections: TransactionsByDaySectionInterface[];
    readonly onLoadMore: () => void;
    readonly accountId: number | null;
}

export const AnalyticsTransactionsPageContent = ({ headerProps, summary, emptyState, sections, onLoadMore, accountId }: Props) => {
    const { title, subtitle, compactTitle } = useTransactionFilterPageTitle(headerProps);

    const expandedTitle = (
        <View className="gap-y-xs">
            <Text
                accessibilityRole="header"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                className="text-3xl font-semibold text-primary"
            >
                {title}
            </Text>
            <Text numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className="text-sm text-secondary-foreground">
                {subtitle}
            </Text>
        </View>
    );
    const collapsedTitle = (
        <Text numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className="text-center text-lg font-semibold text-primary">
            {compactTitle}
        </Text>
    );

    return (
        <GroupedSurface>
            <ScreenChromeThemeProvider>
                <ScreenChromeFrame>
                    <View className="flex-1">
                        <TransactionSectionsList
                            sections={sections}
                            onEndReached={onLoadMore}
                            listEmptyState={emptyState}
                            accountId={accountId}
                            footerSpacerMultiplier={0}
                            listHeader={<View className="pb-xl">{summary}</View>}
                            listComponent={CollapsibleChromeLegendList}
                        />
                    </View>

                    <CollapsibleHeaderBackdrop />

                    <CollapsibleChromeHeaderScrim />

                    <CollapsibleChromeHeader leading={<HeaderBackButton />} expandedTitle={expandedTitle} collapsedTitle={collapsedTitle} />
                </ScreenChromeFrame>
            </ScreenChromeThemeProvider>
        </GroupedSurface>
    );
};
