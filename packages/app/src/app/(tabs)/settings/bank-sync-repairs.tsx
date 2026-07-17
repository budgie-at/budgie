import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined, isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BankSyncRepairSourceRow } from '../../../settings/components/bank-sync-repair-source-row/bank-sync-repair-source-row';
import { BankSyncRepairsConfirmationCard } from '../../../settings/components/bank-sync-repairs-confirmation-card/bank-sync-repairs-confirmation-card';
import { BankSyncRepairsEmptyStateCard } from '../../../settings/components/bank-sync-repairs-empty-state-card/bank-sync-repairs-empty-state-card';
import { BankSyncRepairsErrorCard } from '../../../settings/components/bank-sync-repairs-error-card/bank-sync-repairs-error-card';
import { BankSyncRepairsIntroCard } from '../../../settings/components/bank-sync-repairs-intro-card/bank-sync-repairs-intro-card';
import { useBankSyncRepairsAction } from '../../../settings/hooks/use-bank-sync-repairs-action.hook';
import { getBankSyncRepairText } from '../../../settings/utils/get-bank-sync-repair-text.util';
import { useBankSyncDuplicateRepairPreviewQuery } from '../../../sync/query/use-bank-sync-duplicate-repair-preview.query';

import { BankSyncRepairsPageSelector } from './bank-sync-repairs-page.selector';

const handleGoBack = () => void goBackOrReplace('/settings');

export default function BankSyncRepairsPage() {
    const { t } = useLingui();
    const { errorMessage, isLoading, preview, refresh } = useBankSyncDuplicateRepairPreviewQuery();
    const repairAction = useBankSyncRepairsAction(refresh);

    const duplicateTransactionCount = isDefined(preview?.duplicateTransactionCount) ? preview.duplicateTransactionCount : 0;
    const hasDuplicates = isPositiveNumber(duplicateTransactionCount);
    const hasError = isDefined(errorMessage);
    const sources = isDefined(preview?.sources) ? preview.sources : [];
    const shouldShowEmptyState = !isLoading && !hasError && !hasDuplicates;
    const shouldShowSources = !isLoading && !isEmptyArray(sources);
    const isRepairButtonDisabled = !hasDuplicates || isLoading || repairAction.isRepairing;
    const shouldShowConfirmation = repairAction.isConfirmingRepair && hasDuplicates;
    const buttonContent = isLoading ? t`Checking` : t`Repair Bank Sync Data`;
    const confirmationCountText = getBankSyncRepairText(duplicateTransactionCount, t);

    const handleRefresh = () => void refresh();

    return (
        <CollapsibleChromePage
            title={t`Bank Sync`}
            leading={<GoBackButton onPress={handleGoBack} />}
            contentClassName="gap-y-xl"
            testID={BankSyncRepairsPageSelector.Container}
        >
            <BankSyncRepairsIntroCard />

            {hasError ? <BankSyncRepairsErrorCard errorMessage={errorMessage} isLoading={isLoading} onRefresh={handleRefresh} /> : null}

            {shouldShowEmptyState ? <BankSyncRepairsEmptyStateCard /> : null}

            {shouldShowSources ? (
                <View className="gap-y-lg">
                    {sources.map(source => (
                        <BankSyncRepairSourceRow key={source.externalSource} {...source} />
                    ))}
                </View>
            ) : null}

            {shouldShowConfirmation ? (
                <BankSyncRepairsConfirmationCard
                    countText={confirmationCountText}
                    isRepairing={repairAction.isRepairing}
                    onCancel={repairAction.handleCancelConfirmation}
                    onConfirm={repairAction.handleConfirmRepair}
                />
            ) : (
                <Button
                    testID={BankSyncRepairsPageSelector.RepairButton}
                    onPress={repairAction.handleShowConfirmation}
                    disabled={isRepairButtonDisabled}
                    content={buttonContent}
                    leftIcon={UserIconNameEnum.Wrench}
                    variant="destructive"
                />
            )}
        </CollapsibleChromePage>
    );
}
