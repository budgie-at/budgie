import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';
import { isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { CollapsibleChromeHeaderScrim } from '../../../@generic/component/collapsible-chrome-header-scrim/collapsible-chrome-header-scrim';
import { CollapsibleChromeHeader } from '../../../@generic/component/collapsible-chrome-header/collapsible-chrome-header';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { AccountDetailsHeaderBackdrop } from '../../../account/component/account-details-header-backdrop/account-details-header-backdrop';
import { buildUncategorizedFilters } from '../../../transaction/utils/build-uncategorized-filters.util';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxEmptyState } from '../categorize-inbox-empty-state/categorize-inbox-empty-state';
import { CategorizeInboxList } from '../categorize-inbox-list/categorize-inbox-list';
import { CategorizeInboxNavSubtitle } from '../categorize-inbox-nav-subtitle/categorize-inbox-nav-subtitle';
import { CategorizeInboxPageSelector } from '../categorize-inbox-page/categorize-inbox-page.selector';
import { CategorizeInboxPanel } from '../categorize-inbox-panel/categorize-inbox-panel';

import type { AnalyticsTransactionsRouteParamsInterface } from '../../../transaction/interface/analytics-transactions-route-params.interface';
import type { CategorizeInboxSectionEnum } from '@budgie/categorization';

interface Props {
    readonly params: AnalyticsTransactionsRouteParamsInterface;
}

export const CategorizeInboxPageContent = ({ params }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const [activeSection, setActiveSection] = useState<CategorizeInboxSectionEnum | null>(null);

    const { strategy, items, isLoading, categorizedCount } = useCategorizeInboxContext();
    const pageTitle = strategy?.pageTitle ?? '';
    const filterSection = items.some(item => item.section === activeSection) ? activeSection : null;

    const handleGoBack = (): void => void router.back();
    const handleShowList = (): void =>
        void router.push({
            pathname: '/analytics/transactions',
            params: strategy?.buildListRouteParams(buildUncategorizedFilters(params))
        });

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
                trailing={
                    <HapticPressable
                        className="ml-auto h-10 w-10 items-center justify-center"
                        hitSlop={12}
                        onPress={handleShowList}
                        testID={CategorizeInboxPageSelector.ShowListButton}
                        accessibilityRole="button"
                        accessibilityLabel={t`Show list`}
                    >
                        <Icon icon={UserIconNameEnum.List} className="text-primary" size={24} />
                    </HapticPressable>
                }
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
