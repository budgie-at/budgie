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
import { StickyFooterBand } from '../../../@generic/component/sticky-footer-band/sticky-footer-band';
import { AiProgressBar } from '../../../settings/components/ai-progress-bar/ai-progress-bar';
import { AnalyticsTransactionsModeEnum } from '../../../transaction/enum/analytics-transactions-mode.enum';
import { buildUncategorizedFilters } from '../../../transaction/utils/build-uncategorized-filters.util';
import { buildUncategorizedRouteParams } from '../../../transaction/utils/build-uncategorized-route-params.util';
import { CategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxActions } from '../../hook/use-categorize-inbox-actions.hook';
import { useCategorizeInbox } from '../../hook/use-categorize-inbox.hook';
import { CategorizeInboxAcceptAllButton } from '../categorize-inbox-accept-all-button/categorize-inbox-accept-all-button';
import { CategorizeInboxList } from '../categorize-inbox-list/categorize-inbox-list';
import { CategorizeInboxUndoBar } from '../categorize-inbox-undo-bar/categorize-inbox-undo-bar';

import { CategorizeInboxPageSelector } from './categorize-inbox-page.selector';

import type { AnalyticsTransactionsRouteParamsInterface } from '../../../transaction/interface/analytics-transactions-route-params.interface';

interface Props {
    readonly params: AnalyticsTransactionsRouteParamsInterface;
}

export const CategorizeInboxPage = ({ params }: Props) => {
    const { t } = useLingui();
    const router = useRouter();

    const filters = buildUncategorizedFilters(params);
    const { inbox, isLoading } = useCategorizeInbox(filters);
    const { contextValue, items, acceptableAssignments, remainingCount, categorizedCount, progress } = useCategorizeInboxActions(inbox);

    const handleGoBack = (): void => void router.back();
    const handleShowList = (): void =>
        void router.replace({
            pathname: '/analytics/transactions',
            params: buildUncategorizedRouteParams(filters, AnalyticsTransactionsModeEnum.UNCATEGORIZED)
        });

    const remainingText = t({ message: plural(remainingCount, { one: '# left', other: '# left' }) });
    const doneText = t({ message: plural(categorizedCount, { one: '# done', other: '# done' }) });
    const description = isPositiveNumber(categorizedCount) ? [remainingText, doneText].join(' · ') : remainingText;
    const emptyDescription = isPositiveNumber(categorizedCount)
        ? t({ message: plural(categorizedCount, { one: '# categorized this session', other: '# categorized this session' }) })
        : t`Every transaction has a category.`;
    const progressBar = isPositiveNumber(progress) ? <AiProgressBar progress={progress} /> : null;
    const footer =
        isDefined(contextValue.undoAssignments) || isNotEmptyArray(acceptableAssignments) ? (
            <StickyFooterBand>
                <View className="gap-y-md px-5xl pb-md">
                    {isDefined(contextValue.undoAssignments) ? (
                        <CategorizeInboxUndoBar
                            key={contextValue.undoAssignments[0].clusterKey}
                            assignments={contextValue.undoAssignments}
                        />
                    ) : null}
                    {isNotEmptyArray(acceptableAssignments) ? <CategorizeInboxAcceptAllButton assignments={acceptableAssignments} /> : null}
                </View>
            </StickyFooterBand>
        ) : null;
    const listContent = isEmptyArray(items) ? (
        <View className="flex-1 justify-center gap-y-xl">
            <EmptyState circleIcon={UserIconNameEnum.PartyPopper} title={t`All caught up`} description={emptyDescription} />
            <Button variant="ghost" size="sm" content={t`Done`} onPress={handleGoBack} className="self-center px-7xl" />
        </View>
    ) : (
        <CategorizeInboxList items={items} />
    );

    return (
        <CategorizeInboxContext.Provider value={contextValue}>
            <Page
                testID={CategorizeInboxPageSelector.Container}
                footer={footer}
                header={
                    <PageHeader
                        size="md"
                        title={t`Categorize`}
                        description={description}
                        onGoBack={handleGoBack}
                        bottom={progressBar}
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
                {isLoading ? <ActivityIndicator size="large" /> : listContent}
            </Page>
        </CategorizeInboxContext.Provider>
    );
};
