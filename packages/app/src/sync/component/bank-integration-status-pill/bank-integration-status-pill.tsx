import { SyncEntityInterface, SyncStatusEnum, UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Clock from 'effect/Clock';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Atom from 'effect/reactivity/Atom';
import * as Schedule from 'effect/Schedule';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { cn } from '../../../@generic/utils/cn.util';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useBankIntegration } from '../../context/bank-integration.context';
import { BankIntegrationSyncStatusEnum } from '../../enum/bank-integration-sync-status.enum';
import { useBankIntegrationAccountPreviewsQuery } from '../../query/use-bank-integration-account-previews.query';
import { getBankIntegrationSyncStatus } from '../../utils/get-bank-integration-sync-status.util';

interface Props {
    readonly syncs: Array<Pick<SyncEntityInterface, 'enabled' | 'status' | 'mode' | 'forwardSyncedAt'>>;
}

const STATUS_ICON: Record<BankIntegrationSyncStatusEnum, UserIconNameEnum> = {
    [BankIntegrationSyncStatusEnum.NEEDS_ATTENTION]: UserIconNameEnum.CircleAlert,
    [BankIntegrationSyncStatusEnum.KEY_REJECTED]: UserIconNameEnum.KeyRound,
    [BankIntegrationSyncStatusEnum.SYNCING]: UserIconNameEnum.RefreshCw,
    [BankIntegrationSyncStatusEnum.PAUSED]: UserIconNameEnum.CirclePause,
    [BankIntegrationSyncStatusEnum.STALE]: UserIconNameEnum.Clock,
    [BankIntegrationSyncStatusEnum.UP_TO_DATE]: UserIconNameEnum.CircleCheck
};

const statusNowAtom = Atom.make(context => {
    const fiber = appRuntime.runFork(
        Clock.currentTimeMillis.pipe(
            Effect.tap(now => Effect.sync(() => void context.setSelf(now))),
            Effect.repeat(Schedule.spaced(Duration.minutes(1)))
        )
    );
    context.addFinalizer(() => void appRuntime.runFork(Fiber.interrupt(fiber)));

    return Date.now();
});

export const BankIntegrationStatusPill = ({ syncs }: Props) => {
    const { t } = useLingui();
    const { integration, capabilities } = useBankIntegration();
    const { isKeyRejected } = useBankIntegrationAccountPreviewsQuery(integration.id);
    const { formatRelativeToNow, formatDayAndMonthAndYear } = useFormatDate();
    const now = useAtomValue(statusNowAtom);
    const status = getBankIntegrationSyncStatus(syncs, isKeyRejected, now);
    const lastSyncedAt = syncs
        .filter(sync => !capabilities.supportsLiveSync || sync.enabled)
        .map(sync => sync.forwardSyncedAt)
        .filter(isDefined)
        .reduce<Date | null>((latest, date) => (isDefined(latest) && latest >= date ? latest : date), null);
    const relative = isDefined(lastSyncedAt) ? formatRelativeToNow(lastSyncedAt, now) : '';
    const failedCount = syncs.filter(sync => sync.status === SyncStatusEnum.FAILED).length;
    const statusLabels: Record<BankIntegrationSyncStatusEnum, string> = {
        [BankIntegrationSyncStatusEnum.KEY_REJECTED]: t`Key rejected — sync is paused`,
        [BankIntegrationSyncStatusEnum.NEEDS_ATTENTION]: t({
            message: plural(failedCount, { one: 'Sync failed for # account', other: 'Sync failed for # accounts' })
        }),
        [BankIntegrationSyncStatusEnum.SYNCING]: t`Syncing…`,
        [BankIntegrationSyncStatusEnum.PAUSED]: t`Sync is off for all accounts`,
        [BankIntegrationSyncStatusEnum.STALE]: t`Last synced ${relative}`,
        [BankIntegrationSyncStatusEnum.UP_TO_DATE]: isDefined(lastSyncedAt) ? t`Synced ${relative}` : t`Not synced yet`
    };
    const importDate = isDefined(lastSyncedAt) ? formatDayAndMonthAndYear(lastSyncedAt) : null;
    const importLabel = isDefined(importDate)
        ? t`Updated from statement files · last import ${importDate}`
        : t`Updated from statement files`;
    const label = capabilities.supportsFileImport ? importLabel : statusLabels[status];
    const appearance = {
        className:
            capabilities.supportsLiveSync &&
            (status === BankIntegrationSyncStatusEnum.KEY_REJECTED || status === BankIntegrationSyncStatusEnum.NEEDS_ATTENTION)
                ? 'text-destructive-foreground'
                : 'text-secondary-foreground',
        icon: capabilities.supportsFileImport ? UserIconNameEnum.FileSpreadsheet : STATUS_ICON[status]
    };

    return (
        <View className="flex-row items-center justify-center gap-x-sm" testID={BankIntegrationSelector.StatusPill}>
            <Icon icon={appearance.icon} size={15} className={appearance.className} />
            <Text className={cn(appearance.className, 'text-[15px] text-center shrink')}>{label}</Text>
        </View>
    );
};
