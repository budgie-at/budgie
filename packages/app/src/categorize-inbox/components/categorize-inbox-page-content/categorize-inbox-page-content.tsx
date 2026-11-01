import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';
import { isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { CollapsibleChromeHeaderScrim } from '../../../@generic/component/collapsible-chrome-header-scrim/collapsible-chrome-header-scrim';
import { CollapsibleChromeHeader } from '../../../@generic/component/collapsible-chrome-header/collapsible-chrome-header';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { AccountDetailsHeaderBackdrop } from '../../../account/component/account-details-header-backdrop/account-details-header-backdrop';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxEmptyState } from '../categorize-inbox-empty-state/categorize-inbox-empty-state';
import { CategorizeInboxList } from '../categorize-inbox-list/categorize-inbox-list';
import { CategorizeInboxNavSubtitle } from '../categorize-inbox-nav-subtitle/categorize-inbox-nav-subtitle';
import { CategorizeInboxPageSelector } from '../categorize-inbox-page/categorize-inbox-page.selector';
import { CategorizeInboxPanel } from '../categorize-inbox-panel/categorize-inbox-panel';
import { CategorizeInboxShowListButton } from '../categorize-inbox-show-list-button/categorize-inbox-show-list-button';

import type { AnalyticsTransactionsRouteParamsInterface } from '../../../transaction/interface/analytics-transactions-route-params.interface';
import type { CategorizeInboxSectionEnum } from '@budgie/categorization';

interface Props {
    readonly params: AnalyticsTransactionsRouteParamsInterface;
}

export const CategorizeInboxPageContent = ({ params }: Props) => {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState<CategorizeInboxSectionEnum | null>(null);

    const { strategy, items, isLoading, categorizedCount } = useCategorizeInboxContext();
    const pageTitle = strategy?.pageTitle ?? '';
    const filterSection = items.some(item => item.section === activeSection) ? activeSection : null;

    const handleGoBack = (): void => void router.back();

    const emptyDescription =
        (isPositiveNumber(categorizedCount) ? strategy?.doneThisSession(categorizedCount) : strategy?.emptyDescription) ?? '';
    const panel = isLoading ? null : <CategorizeInboxPanel activeSection={filterSection} />;
    const isEmpty = isEmptyArray(items);
    const navSubtitle = isLoading || isEmpty ? null : <CategorizeInboxNavSubtitle />;
    const body = isEmpty ? (
        <CategorizeInboxEmptyState description={emptyDescription} onDone={handleGoBack} />
    ) : (
        <CategorizeInboxList items={items} filterSection={filterSection} onSectionPress={setActiveSection} />
    );
    const showListButton = isEmpty ? null : <CategorizeInboxShowListButton params={params} />;
    const content = isLoading ? (
        <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" />
        </View>
    ) : (
        body
    );

    return (
        <ScreenChromeFrame testID={CategorizeInboxPageSelector.Container}>
            <View className="flex-1">{content}</View>

            <AccountDetailsHeaderBackdrop />

            <CollapsibleChromeHeaderScrim />

            <CollapsibleChromeHeader
                leading={<GoBackButton onPress={handleGoBack} />}
                trailing={showListButton}
                expandedTitle={
                    <Text className="text-primary text-[22px] font-semibold text-center" numberOfLines={1}>
                        {pageTitle}
                    </Text>
                }
                collapsedTitle={
                    <Text className="text-primary text-[17px] font-semibold text-center" numberOfLines={1}>
                        {pageTitle}
                    </Text>
                }
            />

            {navSubtitle}

            {panel}
        </ScreenChromeFrame>
    );
};
