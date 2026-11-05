import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';
import { isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { CollapsibleChromeHeader } from '../../../@generic/component/collapsible-chrome-header/collapsible-chrome-header';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { CHROME_TITLE_TEXT_PROPS } from '../../../@generic/constant/chrome-title-text-props.constant';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxDoneButton } from '../categorize-inbox-done-button/categorize-inbox-done-button';
import { CategorizeInboxEmptyState } from '../categorize-inbox-empty-state/categorize-inbox-empty-state';
import { CategorizeInboxList } from '../categorize-inbox-list/categorize-inbox-list';
import { CategorizeInboxNavSubtitle } from '../categorize-inbox-nav-subtitle/categorize-inbox-nav-subtitle';
import { CategorizeInboxPageHeaderBackdrop } from '../categorize-inbox-page-header-backdrop/categorize-inbox-page-header-backdrop';
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
    const isEmpty = isEmptyArray(items);
    const doneButton = isEmpty ? <CategorizeInboxDoneButton key="done" /> : null;
    const panel = isLoading ? null : <CategorizeInboxPanel activeSection={filterSection}>{doneButton}</CategorizeInboxPanel>;
    const navSubtitle = isLoading || isEmpty ? null : <CategorizeInboxNavSubtitle />;
    const body = isEmpty ? (
        <CategorizeInboxEmptyState description={emptyDescription} />
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

            <CategorizeInboxPageHeaderBackdrop />

            <CollapsibleChromeHeader
                leading={<GoBackButton onPress={handleGoBack} />}
                trailing={showListButton}
                expandedTitle={
                    <Text className="text-primary text-[22px] font-semibold text-center" {...CHROME_TITLE_TEXT_PROPS}>
                        {pageTitle}
                    </Text>
                }
                collapsedTitle={
                    <Text className="text-primary text-[17px] font-semibold text-center" {...CHROME_TITLE_TEXT_PROPS}>
                        {pageTitle}
                    </Text>
                }
            />

            {navSubtitle}

            {panel}
        </ScreenChromeFrame>
    );
};
