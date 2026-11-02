import { resolveInitialSyncProgress } from '@budgie/sync';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { InstitutionSelector } from '../../../app/(main)/institution/institution.selector';
import { BankIntegrationStatusPill } from '../../../sync/component/bank-integration-status-pill/bank-integration-status-pill';
import { SyncImportProgress } from '../../../sync/component/sync-import-progress/sync-import-progress';
import { useBankIntegration } from '../../../sync/context/bank-integration.context';
import { ACCOUNT_DETAILS_HERO_BALANCE_HEIGHT } from '../../constant/account-details-hero-balance-height.constant';
import { InstitutionAccounts } from '../institution-accounts/institution-accounts';
import { InstitutionConnectionRow } from '../institution-connection-row/institution-connection-row';

import type { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import type { InstitutionGroupInterface } from '../../interface/institution-group.interface';

interface Props {
    readonly institution: InstitutionGroupInterface;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
}

export const InstitutionDetailsSummary = ({ institution, balancesByAccountId }: Props) => {
    const { capabilities } = useBankIntegration();
    const syncs = institution.accounts.map(account => account.sync).filter(isDefined);
    const balanceSlotStyle = { height: ACCOUNT_DETAILS_HERO_BALANCE_HEIGHT };
    const progress = resolveInitialSyncProgress(syncs);

    return (
        <View className="gap-y-4xl">
            <View className="items-center gap-y-lg pb-md" testID={InstitutionSelector.Hero}>
                <View style={balanceSlotStyle} />
                {capabilities.supportsLiveSync ? <BankIntegrationStatusPill syncs={syncs} /> : null}
            </View>
            {isDefined(progress) ? <SyncImportProgress progress={progress} /> : null}
            <InstitutionAccounts institution={institution} balancesByAccountId={balancesByAccountId} />
            <InstitutionConnectionRow syncs={syncs} />
        </View>
    );
};
