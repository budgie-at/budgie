import { UserIconNameEnum } from '@budgie/contracts';
import { msg, plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined, isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useBankSyncDuplicateRepairPreviewQuery } from '../../../sync/query/use-bank-sync-duplicate-repair-preview.query';
import { bankSyncRepairService } from '../../../sync/service/bank-sync-repair.service';

import { BankSyncRepairsPageSelector } from './bank-sync-repairs-page.selector';

import type { BankSyncDuplicateRepairCandidatePreviewInterface } from '../../../sync/interface/bank-sync-duplicate-repair-candidate-preview.interface';
import type { BankSyncDuplicateRepairSourcePreviewInterface } from '../../../sync/interface/bank-sync-duplicate-repair-source-preview.interface';

const handleGoBack = () => void goBackOrReplace('/settings');

const getDuplicateImportedTransactionText = (count: number, t: ReturnType<typeof useLingui>['t']) =>
    t({
        message: plural(count, {
            one: '# duplicate imported transaction',
            other: '# duplicate imported transactions'
        })
    });

const getRemovedTransactionText = (count: number, t: ReturnType<typeof useLingui>['t']) =>
    t({
        message: plural(count, {
            one: '# duplicate transaction removed',
            other: '# duplicate transactions removed'
        })
    });

const getCandidateReference = (externalId: string | null, transactionId: number) => externalId ?? `#${transactionId}`;

const getCandidateDescription = (candidate: BankSyncDuplicateRepairCandidatePreviewInterface, t: ReturnType<typeof useLingui>['t']) => {
    const duplicateReference = getCandidateReference(candidate.duplicateExternalId, candidate.duplicateTransactionId);
    const keptReference = getCandidateReference(candidate.keptExternalId, candidate.keptTransactionId);

    return t(msg`Remove ${duplicateReference}; keep ${keptReference}`);
};

const confirmRepair = async (count: number, t: ReturnType<typeof useLingui>['t']): Promise<boolean> => {
    const countText = getDuplicateImportedTransactionText(count, t);

    return confirmAlert({
        title: t(msg`Repair Bank Sync Data`),
        message: t(msg`Budgie will soft-delete ${countText}. This keeps your manual transactions unchanged.`),
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
    const repairedText = getRemovedTransactionText(result.repairedTransactionCount, t);

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

const renderSourceRow = (source: BankSyncDuplicateRepairSourcePreviewInterface, t: ReturnType<typeof useLingui>['t']) => {
    const sourceDescription = getDuplicateImportedTransactionText(source.duplicateTransactionCount, t);

    return (
        <SimpleHorizontalCell
            key={source.externalSource}
            testID={BankSyncRepairsPageSelector.SourceRow(source.externalSource)}
            left={<CircleIcon icon={UserIconNameEnum.DatabaseZap} variant="warning" border={false} size={40} iconSize={20} />}
            title={source.title}
            description={sourceDescription}
        />
    );
};

const renderCandidateRow = (candidate: BankSyncDuplicateRepairCandidatePreviewInterface, t: ReturnType<typeof useLingui>['t']) => (
    <SimpleHorizontalCell
        key={candidate.duplicateTransactionId}
        testID={BankSyncRepairsPageSelector.CandidateRow(candidate.duplicateTransactionId)}
        left={<CircleIcon icon={UserIconNameEnum.ArrowRightLeft} variant="ghost" border={false} size={36} iconSize={18} />}
        title={candidate.title}
        description={getCandidateDescription(candidate, t)}
    />
);

const renderSourceSection = (source: BankSyncDuplicateRepairSourcePreviewInterface, t: ReturnType<typeof useLingui>['t']) => (
    <View key={source.externalSource} className="gap-y-sm">
        {renderSourceRow(source, t)}
        <View className="gap-y-sm pl-3xl">{source.candidates.map(candidate => renderCandidateRow(candidate, t))}</View>
    </View>
);

const INTRO_CARD = (
    <Card className="gap-y-3xl" variant="primary">
        <CircleIcon icon={UserIconNameEnum.Wrench} variant="dark-warning" border={false} size={48} iconSize={24} />

        <View className="gap-y-sm">
            <Text className="text-primary text-base font-semibold">
                <Trans>Duplicate imported transactions</Trans>
            </Text>
            <Text className="text-secondary-foreground text-sm">
                <Trans>
                    Budgie can find duplicate transactions created by bank sync import issues and soft-delete only the extra imported
                    copies.
                </Trans>
            </Text>
        </View>
    </Card>
);

const EMPTY_STATE_CARD = (
    <Card testID={BankSyncRepairsPageSelector.EmptyState} className="items-center gap-y-2xl" variant="positive">
        <CircleIcon icon={UserIconNameEnum.CircleCheck} variant="positive" border={false} size={44} iconSize={22} />
        <Text className="text-positive-foreground text-sm font-medium text-center">
            <Trans>No duplicate imported transactions found.</Trans>
        </Text>
    </Card>
);

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
                {INTRO_CARD}

                {hasError ? (
                    <Card variant="destructive" className="gap-y-lg">
                        <Text className="text-destructive-foreground text-sm font-semibold">
                            <Trans>Could not check bank sync data</Trans>
                        </Text>
                        <Text testID={BankSyncRepairsPageSelector.ErrorText} className="text-destructive-foreground text-sm">
                            {errorMessage}
                        </Text>
                        <Button
                            testID={BankSyncRepairsPageSelector.ErrorRetryButton}
                            onPress={handleRefresh}
                            disabled={isLoading}
                            content={t`Try Again`}
                            leftIcon={UserIconNameEnum.RefreshCw}
                            variant="destructive"
                            size="sm"
                        />
                    </Card>
                ) : null}

                {shouldShowEmptyState ? EMPTY_STATE_CARD : null}

                {shouldShowSources ? <View className="gap-y-lg">{sources.map(source => renderSourceSection(source, t))}</View> : null}

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
