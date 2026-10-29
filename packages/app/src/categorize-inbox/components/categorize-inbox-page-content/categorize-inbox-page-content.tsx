import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { CollapsibleHeaderBackdrop, ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';
import { isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { CollapsibleChromeHeaderScrim } from '../../../@generic/component/collapsible-chrome-header-scrim/collapsible-chrome-header-scrim';
import { CollapsibleChromeHeader } from '../../../@generic/component/collapsible-chrome-header/collapsible-chrome-header';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { buildUncategorizedFilters } from '../../../transaction/utils/build-uncategorized-filters.util';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxEmptyState } from '../categorize-inbox-empty-state/categorize-inbox-empty-state';
import { CategorizeInboxList } from '../categorize-inbox-list/categorize-inbox-list';
import { CategorizeInboxPageSelector } from '../categorize-inbox-page/categorize-inbox-page.selector';
import { CategorizeInboxPanel } from '../categorize-inbox-panel/categorize-inbox-panel';

import type { AnalyticsTransactionsRouteParamsInterface } from '../../../transaction/interface/analytics-transactions-route-params.interface';

interface Props {
    readonly params: AnalyticsTransactionsRouteParamsInterface;
}

export const CategorizeInboxPageContent = ({ params }: Props) => {
    const { t } = useLingui();
    const router = useRouter();

    const filters = buildUncategorizedFilters(params);
    const { strategy, items, isLoading, categorizedCount } = useCategorizeInboxContext();
    const pageTitle = strategy?.pageTitle ?? '';

    const handleGoBack = (): void => void router.back();
    const handleShowList = (): void =>
        void router.push({ pathname: '/analytics/transactions', params: strategy?.buildListRouteParams(filters) });

    const emptyDescription =
        (isPositiveNumber(categorizedCount) ? strategy?.doneThisSession(categorizedCount) : strategy?.emptyDescription) ?? '';
    const panel = isLoading ? null : <CategorizeInboxPanel />;
    const body = isEmptyArray(items) ? (
        <CategorizeInboxEmptyState description={emptyDescription} onDone={handleGoBack} />
    ) : (
        <CategorizeInboxList items={items} />
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

            <CollapsibleHeaderBackdrop />

            <CollapsibleChromeHeaderScrim />

            <CollapsibleChromeHeader
                leading={<GoBackButton onPress={handleGoBack} />}
                trailing={
                    <HapticPressable
                        className="h-11 w-11 items-center justify-center"
                        onPress={handleShowList}
                        testID={CategorizeInboxPageSelector.ShowListButton}
                        accessibilityRole="button"
                        accessibilityLabel={t`Show list`}
                    >
                        <CircleIcon icon={UserIconNameEnum.List} variant="ghost" size={40} iconSize={24} border={false} />
                    </HapticPressable>
                }
                expandedTitle={
                    <Text className="text-primary font-medium text-3xl" numberOfLines={1}>
                        {pageTitle}
                    </Text>
                }
                collapsedTitle={
                    <Text className="text-primary text-lg font-semibold text-center" numberOfLines={1}>
                        {pageTitle}
                    </Text>
                }
            />

            {panel}
        </ScreenChromeFrame>
    );
};
