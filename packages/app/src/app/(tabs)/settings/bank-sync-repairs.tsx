import { UserIconNameEnum } from '@budgie/contracts';
import { msg, plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined, isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BankSyncRepairSourceRow } from '../../../settings/components/bank-sync-repair-source-row/bank-sync-repair-source-row';
import { BankSyncRepairsEmptyStateCard } from '../../../settings/components/bank-sync-repairs-empty-state-card/bank-sync-repairs-empty-state-card';
import { BankSyncRepairsErrorCard } from '../../../settings/components/bank-sync-repairs-error-card/bank-sync-repairs-error-card';
import { BankSyncRepairsIntroCard } from '../../../settings/components/bank-sync-repairs-intro-card/bank-sync-repairs-intro-card';
import { getBankSyncRepairText } from '../../../settings/utils/get-bank-sync-repair-text.util';
import { useBankSyncDuplicateRepairPreviewQuery } from '../../../sync/query/use-bank-sync-duplicate-repair-preview.query';
import { bankSyncRepairService } from '../../../sync/service/bank-sync-repair.service';

import { BankSyncRepairsPageSelector } from './bank-sync-repairs-page.selector';

const handleGoBack = () => void goBackOrReplace('/settings');

const getRepairedTransactionText = (count: number, t: ReturnType<typeof useLingui>['t']) =>
    t({
        message: plural(count, {
            one: '# bank sync item repaired',
            other: '# bank sync items repaired'
        })
    });

const confirmRepair = async (count: number, t: ReturnType<typeof useLingui>['t']): Promise<boolean> => {
    const countText = getBankSyncRepairText(count, t);

    return confirmAlert({
        title: t(msg`Repair Bank Sync Data`),
        message: t(msg`Budgie will apply ${countText}: soft-delete duplicate imports and repair duplicated transfer consolidations.`),
        confirmText: t(msg`Repair`),
        cancelText: t(msg`Cancel`),
        isDestructive: true
    });
};

const previewAndConfirmRepair = async (refresh: () => Promise<void>, t: ReturnType<typeof useLingui>['t']): Promise<boolean> => {
    const freshPreview = await bankSyncRepairService.previewDuplicates();
    const freshCount = freshPreview.duplicateTransactionCount;

    if (isPositiveNumber(freshCount)) {
        return confirmRepair(freshCount, t);
    }

    Toast.show({ type: 'success', text1: t(msg`No repairs needed`) });
    await refresh();

    return false;
};

const removeDuplicatesAndRefresh = async (refresh: () => Promise<void>, t: ReturnType<typeof useLingui>['t']): Promise<void> => {
    const result = await bankSyncRepairService.removeDuplicates();
    const repairedText = getRepairedTransactionText(result.repairedTransactionCount, t);

    Toast.show({ type: 'success', text1: t(msg`Bank sync data repaired`), text2: repairedText });
    await refresh();
};

const repairDuplicates = async (refresh: () => Promise<void>, t: ReturnType<typeof useLingui>['t']): Promise<void> => {
    const confirmed = await previewAndConfirmRepair(refresh, t);

    if (!confirmed) {
        return;
    }

    await removeDuplicatesAndRefresh(refresh, t);
};

export default function BankSyncRepairsPage() {
    const { t } = useLingui();
    const { errorMessage, isLoading, preview, refresh } = useBankSyncDuplicateRepairPreviewQuery();
    const [isRepairing, setIsRepairing] = useState(false);
    const isRepairingRef = useRef(false);

    const duplicateTransactionCount = preview?.duplicateTransactionCount ?? 0;
    const hasDuplicates = isPositiveNumber(duplicateTransactionCount);
    const hasError = isDefined(errorMessage);
    const sources = preview?.sources ?? [];
    const shouldShowEmptyState = !isLoading && !hasError && !hasDuplicates;
    const shouldShowSources = !isLoading && !isEmptyArray(sources);
    const isRepairButtonDisabled = !hasDuplicates || isLoading || isRepairing;
    const buttonContent = isLoading ? t`Checking` : t`Repair Bank Sync Data`;

    const handleRefresh = () => void refresh();

    const handleRepair = () => {
        if (isRepairingRef.current) {
            return;
        }

        isRepairingRef.current = true;
        setIsRepairing(true);

        void repairDuplicates(refresh, t)
            .catch((error: unknown) => {
                Toast.show({ type: 'error', text1: t`Could not repair bank sync data`, text2: getErrorMessage(error) });
            })
            .finally(() => {
                isRepairingRef.current = false;
                setIsRepairing(false);
            });
    };

    return (
        <Page
            testID={BankSyncRepairsPageSelector.Container}
            header={<PageHeader title={t`Repair Bank Sync Data`} onGoBack={handleGoBack} />}
        >
            <ScrollView className="flex-1" contentContainerClassName="gap-y-xl pb-5xl pt-3xl" showsVerticalScrollIndicator={false}>
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

                <Button
                    testID={BankSyncRepairsPageSelector.RepairButton}
                    onPress={handleRepair}
                    disabled={isRepairButtonDisabled}
                    isLoading={isRepairing}
                    content={buttonContent}
                    leftIcon={UserIconNameEnum.Wrench}
                    variant="destructive"
                />
            </ScrollView>
        </Page>
    );
}
