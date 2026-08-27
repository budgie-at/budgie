import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ScrollView, View } from 'react-native';

import { isDefined, isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { Page } from '../../../@generic/component/page/page';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { SyncRepairSourceRow } from '../../../settings/components/sync-repair-source-row/sync-repair-source-row';
import { SyncRepairsConfirmationCard } from '../../../settings/components/sync-repairs-confirmation-card/sync-repairs-confirmation-card';
import { SyncRepairsEmptyStateCard } from '../../../settings/components/sync-repairs-empty-state-card/sync-repairs-empty-state-card';
import { SyncRepairsErrorCard } from '../../../settings/components/sync-repairs-error-card/sync-repairs-error-card';
import { SyncRepairsIntroCard } from '../../../settings/components/sync-repairs-intro-card/sync-repairs-intro-card';
import { useSyncRepairsAction } from '../../../settings/hooks/use-sync-repairs-action.hook';
import { getSyncRepairText } from '../../../settings/utils/get-sync-repair-text.util';
import { useSyncDuplicateRepairPreviewQuery } from '../../../sync/query/use-sync-duplicate-repair-preview.query';

import { SyncRepairsPageSelector } from './sync-repairs-page.selector';

const handleGoBack = () => void goBackOrReplace('/settings');

export default function SyncRepairsPage() {
    const { t } = useLingui();
    const { errorMessage, isLoading, preview, refresh } = useSyncDuplicateRepairPreviewQuery();
    const repairAction = useSyncRepairsAction(refresh);

    const duplicateTransactionCount = preview?.duplicateTransactionCount ?? 0;
    const hasDuplicates = isPositiveNumber(duplicateTransactionCount);
    const hasError = isDefined(errorMessage);
    const sources = preview?.sources ?? [];
    const shouldShowEmptyState = !isLoading && !hasError && !hasDuplicates;
    const shouldShowSources = !isLoading && !isEmptyArray(sources);
    const isRepairButtonDisabled = !hasDuplicates || isLoading || repairAction.isRepairing;
    const shouldShowConfirmation = repairAction.isConfirmingRepair && hasDuplicates;
    const buttonContent = isLoading ? t`Checking` : t`Repair Sync Data`;
    const confirmationCountText = getSyncRepairText(duplicateTransactionCount, t);

    const handleRefresh = () => void refresh();

    return (
        <Page testID={SyncRepairsPageSelector.Container} header={<PageHeader title={t`Sync Repairs`} onGoBack={handleGoBack} />}>
            <ScrollView className="flex-1" contentContainerClassName="gap-y-xl pb-5xl pt-3xl" showsVerticalScrollIndicator={false}>
                <SyncRepairsIntroCard />

                {hasError ? <SyncRepairsErrorCard errorMessage={errorMessage} isLoading={isLoading} onRefresh={handleRefresh} /> : null}

                {shouldShowEmptyState ? <SyncRepairsEmptyStateCard /> : null}

                {shouldShowSources ? (
                    <View className="gap-y-lg">
                        {sources.map(source => (
                            <SyncRepairSourceRow key={source.externalSource} {...source} />
                        ))}
                    </View>
                ) : null}

                {shouldShowConfirmation ? (
                    <SyncRepairsConfirmationCard
                        countText={confirmationCountText}
                        isRepairing={repairAction.isRepairing}
                        onCancel={repairAction.handleCancelConfirmation}
                        onConfirm={repairAction.handleConfirmRepair}
                    />
                ) : (
                    <Button
                        testID={SyncRepairsPageSelector.RepairButton}
                        onPress={repairAction.handleShowConfirmation}
                        disabled={isRepairButtonDisabled}
                        content={buttonContent}
                        leftIcon={UserIconNameEnum.Wrench}
                        variant="destructive"
                    />
                )}
            </ScrollView>
        </Page>
    );
}
