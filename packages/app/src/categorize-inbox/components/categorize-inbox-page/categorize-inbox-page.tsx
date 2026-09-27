import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { isDefined, isEmptyArray, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { Page } from '../../../@generic/component/page/page';
import { AnalyticsTransactionsModeEnum } from '../../../transaction/enum/analytics-transactions-mode.enum';
import { buildUncategorizedFilters } from '../../../transaction/utils/build-uncategorized-filters.util';
import { buildUncategorizedRouteParams } from '../../../transaction/utils/build-uncategorized-route-params.util';
import { CategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxActions } from '../../hook/use-categorize-inbox-actions.hook';
import { useCategorizeInbox } from '../../hook/use-categorize-inbox.hook';
import { CategorizeInboxList } from '../categorize-inbox-list/categorize-inbox-list';
import { CategorizeInboxPanel } from '../categorize-inbox-panel/categorize-inbox-panel';

import { CategorizeInboxPageSelector } from './categorize-inbox-page.selector';

import type { AnalyticsTransactionsRouteParamsInterface } from '../../../transaction/interface/analytics-transactions-route-params.interface';

interface Props {
    readonly params: AnalyticsTransactionsRouteParamsInterface;
}

export const CategorizeInboxPage = ({ params }: Props) => {
    const { t } = useLingui();
    const router = useRouter();

    const filters = buildUncategorizedFilters(params);
    const inbox = useCategorizeInbox(filters);
    const { contextValue, items, expandedClusterKey, acceptableAssignments, undoAssignments, undo, remainingCount, categorizedCount } =
        useCategorizeInboxActions(inbox);

    const handleGoBack = (): void => void router.back();
    const handleShowList = (): void =>
        void router.push({
            pathname: '/analytics/transactions',
            params: buildUncategorizedRouteParams(filters, AnalyticsTransactionsModeEnum.UNCATEGORIZED)
        });

    const remainingText = t({ message: plural(remainingCount, { one: '# left', other: '# left' }) });
    const emptyDescription = isPositiveNumber(categorizedCount)
        ? t({ message: plural(categorizedCount, { one: '# categorized this session', other: '# categorized this session' }) })
        : t`Every transaction has a category.`;
    const hasPanel = !inbox.isLoading && (isNotEmptyArray(items) || isDefined(undoAssignments));
    const panel = hasPanel ? (
        <CategorizeInboxPanel
            remainingCount={remainingCount}
            categorizedCount={categorizedCount}
            acceptableAssignments={acceptableAssignments}
            undoAssignments={undoAssignments}
            onUndo={undo}
        />
    ) : null;
    const listContent = isEmptyArray(items) ? (
        <View className="flex-1 justify-center gap-y-xl">
            <EmptyState circleIcon={UserIconNameEnum.PartyPopper} title={t`All caught up`} description={emptyDescription} />
            <Button variant="ghost" size="sm" content={t`Done`} onPress={handleGoBack} className="self-center px-7xl" />
        </View>
    ) : (
        <CategorizeInboxList items={items} expandedClusterKey={expandedClusterKey} />
    );

    return (
        <CategorizeInboxContext.Provider value={contextValue}>
            <Page
                testID={CategorizeInboxPageSelector.Container}
                footer={panel}
                header={
                    <PageHeader
                        size="md"
                        title={t`Categorize`}
                        description={remainingText}
                        onGoBack={handleGoBack}
                        right={
                            <HapticPressable
                                className="ml-auto h-10 w-10 items-center justify-center"
                                onPress={handleShowList}
                                testID={CategorizeInboxPageSelector.ShowListButton}
                                accessibilityRole="button"
                                accessibilityLabel={t`Show list`}
                            >
                                <CircleIcon icon={UserIconNameEnum.List} variant="ghost" size={40} iconSize={24} border={false} />
                            </HapticPressable>
                        }
                    />
                }
            >
                {inbox.isLoading ? <ActivityIndicator size="large" /> : listContent}
            </Page>
        </CategorizeInboxContext.Provider>
    );
};
