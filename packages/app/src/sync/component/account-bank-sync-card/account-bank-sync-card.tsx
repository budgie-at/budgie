import { BankSyncModeEnum, BankSyncStatusEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useAccountBankSync } from '../../hook/use-account-bank-sync.hook';
import { monobankSyncService } from '../../service/monobank-sync.service';
import { buildBankSyncStatusLabel } from '../../utils/build-bank-sync-status-label.util';
import { BankSyncTokenSection } from '../bank-sync-token-section/bank-sync-token-section';
import { ResyncBankSyncAccount } from '../resync-bank-sync-account/resync-bank-sync-account';
import { SyncDataRow } from '../sync-data-row/sync-data-row';

import type { AccountBankSyncCardPropsInterface } from '../../interface/account-bank-sync-card-props.interface';

const statusTextVariants = cva('text-xs font-medium', {
    variants: {
        status: {
            [BankSyncStatusEnum.FAILED]: 'text-destructive',
            [BankSyncStatusEnum.SYNCING]: 'text-amber-600',
            [BankSyncStatusEnum.IDLE]: 'text-green-600'
        }
    }
});

export const AccountBankSyncCard = ({ accountId }: AccountBankSyncCardPropsInterface) => {
    const { t } = useLingui();
    const { bankSync, hasBankSync } = useAccountBankSync(accountId);
    const { formatDayAndMonthAndYearWithTime } = useFormatDate();

    if (!hasBankSync || !isDefined(bankSync)) {
        return null;
    }

    const isForwardMode = bankSync.mode === BankSyncModeEnum.FORWARD;
    const isSyncing = bankSync.status === BankSyncStatusEnum.SYNCING;
    const statusLabel = buildBankSyncStatusLabel({ status: bankSync.status, isForwardMode, isSyncing });

    const handleToggle = (enabled: boolean) => {
        void monobankSyncService.setAccountSyncEnabled(accountId, enabled);
    };

    return (
        <Card className="p-4xl gap-y-lg">
            <View className="flex-row items-center justify-between gap-2">
                <ResyncBankSyncAccount accountId={accountId} />
                <View className="content-center items-center">
                    <Text className="text-primary font-semibold text-base">
                        <Trans>Bank Sync</Trans>
                    </Text>
                    <Text className={statusTextVariants({ status: bankSync.status })}>{statusLabel}</Text>
                </View>
                <View className="content-center">
                    <ThemedSwitch value={bankSync.enabled} onValueChange={handleToggle} />
                </View>
            </View>

            <View className="gap-y-sm border-t border-secondary-corner pt-lg">
                <SyncDataRow label={t`Transactions synced`} value={String(bankSync.transactionCount)} />

                {isDefined(bankSync.forwardSyncedAt) && (
                    <SyncDataRow label={t`Last sync`} value={formatDayAndMonthAndYearWithTime(bankSync.forwardSyncedAt)} />
                )}

                {isDefined(bankSync.backwardSyncedAt) && (
                    <SyncDataRow label={t`History synced`} value={formatDayAndMonthAndYearWithTime(bankSync.backwardSyncedAt)} />
                )}

                {bankSync.errorCount > 0 && (
                    <>
                        <SyncDataRow label={t`Errors`} value={String(bankSync.errorCount)} />
                        {isNotEmptyString(bankSync.lastError) && (
                            <View className="gap-y-xs">
                                <Text className="text-xs text-secondary-foreground">
                                    <Trans>Last error</Trans>
                                </Text>
                                <Text className="text-secondary-foreground text-destructive text-xs" numberOfLines={2}>
                                    {bankSync.lastError}
                                </Text>
                            </View>
                        )}
                    </>
                )}

                <BankSyncTokenSection accountId={accountId} token={bankSync.token} />
            </View>
        </Card>
    );
};
