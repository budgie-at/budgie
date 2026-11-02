import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { SyncRepairSourceRow } from '../../../settings/components/sync-repair-source-row/sync-repair-source-row';
import { SyncRepairsEmptyStateCard } from '../../../settings/components/sync-repairs-empty-state-card/sync-repairs-empty-state-card';
import { SyncRepairsErrorCard } from '../../../settings/components/sync-repairs-error-card/sync-repairs-error-card';
import { useSyncRepairsAction } from '../../../settings/hooks/use-sync-repairs-action.hook';
import { goBackToSettings } from '../../../settings/utils/go-back-to-settings.util';
import { useSyncDuplicateRepairPreviewQuery } from '../../../sync/query/use-sync-duplicate-repair-preview.query';

import { SyncRepairsPageSelector } from './sync-repairs-page.selector';

export default function SyncRepairsPage() {
    const { t } = useLingui();
    const { errorMessage, isLoading, preview, refresh } = useSyncDuplicateRepairPreviewQuery();
    const { handleRepair, isRepairing, repairedTransactionCount } = useSyncRepairsAction(refresh);
    const duplicateTransactionCount = preview?.duplicateTransactionCount ?? 0;
    const hasDuplicates = isPositiveNumber(duplicateTransactionCount);
    const hasError = isDefined(errorMessage);
    const sources = preview?.sources ?? [];
    const shouldShowEmptyState = !isLoading && !hasError && !hasDuplicates;
    const shouldShowFound = !hasError && (isLoading || hasDuplicates);
    const isRepairDisabled = !hasDuplicates || isLoading;
    const isActionLoading = isRepairing || isLoading;
    const repairPressableProps = { disabled: isRepairDisabled || isRepairing, accessibilityState: { busy: isActionLoading } };
    const actionLabel = t({ message: plural(duplicateTransactionCount, { one: 'Remove # duplicate', other: 'Remove # duplicates' }) });

    return (
        <GroupedSurface>
            <CollapsibleChromePage
                scrimClassName="bg-surface"
                title={t`Sync repairs`}
                leading={<GoBackButton onPress={goBackToSettings} />}
                testID={SyncRepairsPageSelector.Container}
            >
                <View className="gap-y-[8px] pb-5xl">
                    {hasError ? <SyncRepairsErrorCard errorMessage={errorMessage} isLoading={isLoading} onRefresh={refresh} /> : null}
                    {shouldShowEmptyState ? <SyncRepairsEmptyStateCard repairedTransactionCount={repairedTransactionCount} /> : null}
                    {shouldShowFound ? (
                        <GroupedListSection title={t`Found`}>
                            <LoadingContent isLoading={isLoading}>
                                {isNotEmptyArray(sources) ? (
                                    sources.map(source => <SyncRepairSourceRow key={source.externalSource} {...source} />)
                                ) : (
                                    <GroupedListRow
                                        title={t`Synced data`}
                                        right={<Text className="text-secondary-foreground text-[17px]">{t`Checking`}</Text>}
                                    />
                                )}
                            </LoadingContent>
                            <GroupedListRow
                                title={
                                    <LoadingContent isLoading={isActionLoading}>
                                        <Text className="text-primary text-[17px]">{actionLabel}</Text>
                                    </LoadingContent>
                                }
                                right={<View />}
                                onPress={handleRepair}
                                pressableProps={repairPressableProps}
                                testID={SyncRepairsPageSelector.RepairButton}
                            />
                        </GroupedListSection>
                    ) : null}
                    <Text className="text-secondary-foreground px-3xl text-[13px] leading-[18px]">
                        {t`Budgie removes repeated bank imports and fixes transfers that landed on inactive accounts. Manual transactions are never changed.`}
                    </Text>
                    <MenuSpacer />
                </View>
            </CollapsibleChromePage>
        </GroupedSurface>
    );
}
