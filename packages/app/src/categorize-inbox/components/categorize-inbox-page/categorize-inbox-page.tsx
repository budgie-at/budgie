import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { isDefined, isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

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
import { CategorizeInboxHero } from '../categorize-inbox-hero/categorize-inbox-hero';
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
    const { contextValue, progress } = useCategorizeInboxActions(inbox.totalRowCount);

    const handleGoBack = (): void => void router.back();
    const handleShowList = (): void =>
        void router.replace({
            pathname: '/analytics/transactions',
            params: buildUncategorizedRouteParams(filters, AnalyticsTransactionsModeEnum.UNCATEGORIZED)
        });

    const remainingText = t({ message: plural(inbox.totalRowCount, { one: '# left', other: '# left' }) });
    const progressBar = isPositiveNumber(progress) ? <AiProgressBar progress={progress} /> : null;
    const footer = isDefined(contextValue.undoAssignments) ? (
        <StickyFooterBand>
            <CategorizeInboxUndoBar assignments={contextValue.undoAssignments} />
        </StickyFooterBand>
    ) : null;
    const listContent = isEmptyArray(inbox.items) ? (
        <View className="flex-1 justify-center">
            <EmptyState
                circleIcon={UserIconNameEnum.PartyPopper}
                title={t`All caught up`}
                description={t`Every transaction has a category.`}
            />
        </View>
    ) : (
        <CategorizeInboxList items={inbox.items}>
            <CategorizeInboxHero assignments={inbox.confidentAssignments} />
        </CategorizeInboxList>
    );
    const content = isLoading ? <ActivityIndicator size="large" /> : listContent;

    return (
        <CategorizeInboxContext.Provider value={contextValue}>
            <Page
                testID={CategorizeInboxPageSelector.Container}
                footer={footer}
                header={
                    <PageHeader
                        size="md"
                        title={t`Categorize`}
                        description={remainingText}
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
                {content}
            </Page>
        </CategorizeInboxContext.Provider>
    );
};
