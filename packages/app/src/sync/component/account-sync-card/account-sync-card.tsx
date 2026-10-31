import { ExternalSourceEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { BANK_PROVIDER_TITLE } from '../../../account/constant/bank-provider-title.constant';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useAccountSync } from '../../hook/use-account-sync.hook';
import { AccountSyncProblemRow } from '../account-sync-problem-row/account-sync-problem-row';
import { AccountSyncToggleRow } from '../account-sync-toggle-row/account-sync-toggle-row';
import { AccountSyncWarningRow } from '../account-sync-warning-row/account-sync-warning-row';
import { BinanceSyncTokenSection } from '../binance-sync-token-section/binance-sync-token-section';
import { ResyncAccount } from '../resync-account/resync-account';

import { AccountSyncCardSelector } from './account-sync-card.selector';

interface Props {
    readonly accountId: number;
}

export const AccountSyncCard = ({ accountId }: Props) => {
    const { t } = useLingui();
    const { sync } = useAccountSync(accountId);
    const { formatDayAndMonthAndYear } = useFormatDate();

    if (!isDefined(sync)) {
        return null;
    }

    const providerTitle = BANK_PROVIDER_TITLE[sync.provider];
    const providerName = isDefined(providerTitle) ? t(providerTitle) : null;
    const sectionTitle = isDefined(providerName) ? t`${providerName} sync` : t`Sync`;
    const { transactionCount } = sync;
    const historyStart = isDefined(sync.backwardSyncedAt) ? formatDayAndMonthAndYear(sync.backwardSyncedAt) : null;
    const footerProps = isDefined(historyStart) ? { footer: t`${transactionCount} transactions synced since ${historyStart}` } : {};
    const warningRow = isDefined(sync.lastWarning) ? <AccountSyncWarningRow warning={sync.lastWarning} /> : null;
    const tokenRow =
        sync.provider === ExternalSourceEnum.BINANCE ? (
            <View className="px-3xl py-lg">
                <BinanceSyncTokenSection accountId={accountId} />
            </View>
        ) : null;

    return (
        <GroupedListSection title={sectionTitle} {...footerProps}>
            <AccountSyncToggleRow sync={sync} />

            <AccountSyncProblemRow sync={sync} />

            {warningRow}

            <ResyncAccount accountId={accountId} subtitle={t`Choose dates to sync again`} testID={AccountSyncCardSelector.ResyncButton} />

            {tokenRow}
        </GroupedListSection>
    );
};
