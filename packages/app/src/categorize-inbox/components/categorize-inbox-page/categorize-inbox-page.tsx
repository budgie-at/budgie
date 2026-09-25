import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { ActivityIndicator } from 'react-native';

import { isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { CircularActionButton } from '../../../@generic/component/circular-action-button/circular-action-button';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { Page } from '../../../@generic/component/page/page';
import { StickyFooterBand } from '../../../@generic/component/sticky-footer-band/sticky-footer-band';
import { buildUncategorizedFilters } from '../../../transaction/utils/build-uncategorized-filters.util';
import { CategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxActions } from '../../hook/use-categorize-inbox-actions.hook';
import { useCategorizeInbox } from '../../hook/use-categorize-inbox.hook';
import { CategorizeInboxList } from '../categorize-inbox-list/categorize-inbox-list';
import { CategorizeInboxMakeRuleButton } from '../categorize-inbox-make-rule-button/categorize-inbox-make-rule-button';
import { CategorizeInboxProgress } from '../categorize-inbox-progress/categorize-inbox-progress';
import { CategorizeInboxUndoBar } from '../categorize-inbox-undo-bar/categorize-inbox-undo-bar';

import { CategorizeInboxPageSelector } from './categorize-inbox-page.selector';

import type { AnalyticsTransactionsRouteParamsInterface } from '../../../transaction/interface/analytics-transactions-route-params.interface';

interface Props {
    readonly params: AnalyticsTransactionsRouteParamsInterface;
}

export const CategorizeInboxPage = ({ params }: Props) => {
    const { t } = useLingui();

    const filters = buildUncategorizedFilters(params);
    const { inbox, isLoading, enrichmentStatus } = useCategorizeInbox(filters);
    const {
        contextValue,
        confidentRowCount,
        undoAssignments,
        assignedRowCount,
        singleAssignment,
        handleAcceptConfidentPress,
        handleUndoPress,
        handleDismissUndo,
        handleShowList,
        handleGoBack
    } = useCategorizeInboxActions(inbox, filters);

    const remainingText = t({ message: plural(inbox.totalRowCount, { one: '# transaction left', other: '# transactions left' }) });
    const isEmpty = isEmptyArray(inbox.clusters);

    const header = (
        <PageHeader
            title={t`Categorize`}
            description={remainingText}
            onGoBack={handleGoBack}
            right={
                <CircularActionButton
                    icon={UserIconNameEnum.List}
                    onPress={handleShowList}
                    testID={CategorizeInboxPageSelector.ShowListButton}
                />
            }
        />
    );

    const footer =
        isDefined(undoAssignments) && isNotEmptyArray(undoAssignments) ? (
            <StickyFooterBand>
                <CategorizeInboxUndoBar assignedRowCount={assignedRowCount} onUndo={handleUndoPress} onDismiss={handleDismissUndo}>
                    {isDefined(singleAssignment) ? <CategorizeInboxMakeRuleButton assignment={singleAssignment} /> : null}
                </CategorizeInboxUndoBar>
            </StickyFooterBand>
        ) : null;

    const inboxContent = (
        <>
            <CategorizeInboxProgress
                confidentRowCount={confidentRowCount}
                enrichmentStatus={enrichmentStatus}
                onAcceptConfident={handleAcceptConfidentPress}
            />
            <CategorizeInboxList items={inbox.items} />
        </>
    );
    const emptyContent = (
        <EmptyState
            circleIcon={UserIconNameEnum.CircleCheckBig}
            title={t`All caught up`}
            description={t`Every transaction has a category.`}
        />
    );
    const nonLoadingContent = isEmpty ? emptyContent : inboxContent;
    const content = isLoading ? <ActivityIndicator size="large" /> : nonLoadingContent;

    return (
        <CategorizeInboxContext.Provider value={contextValue}>
            <Page header={header} footer={footer} testID={CategorizeInboxPageSelector.Container}>
                {content}
            </Page>
        </CategorizeInboxContext.Provider>
    );
};
