import { ExternalSourceEnum } from '@budgie/contracts';
import { resolveInitialSyncProgress } from '@budgie/sync';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { InstitutionSelector } from '../../../app/(main)/institution/institution.selector';
import { InzhurFreshnessLine } from '../../../inzhur/component/inzhur-freshness-line/inzhur-freshness-line';
import { InzhurImportStatementAction } from '../../../inzhur/component/inzhur-import-statement-action/inzhur-import-statement-action';
import { InzhurInstitutionChart } from '../../../inzhur/component/inzhur-institution-chart/inzhur-institution-chart';
import { InzhurInstitutionGainLine } from '../../../inzhur/component/inzhur-institution-gain-line/inzhur-institution-gain-line';
import { InzhurPendingTopUps } from '../../../inzhur/component/inzhur-pending-top-ups/inzhur-pending-top-ups';
import { BankIntegrationStatusPill } from '../../../sync/component/bank-integration-status-pill/bank-integration-status-pill';
import { SyncImportProgress } from '../../../sync/component/sync-import-progress/sync-import-progress';
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
    const syncs = institution.accounts.map(account => account.sync).filter(isDefined);
    const balanceSlotStyle = { height: ACCOUNT_DETAILS_HERO_BALANCE_HEIGHT };
    const progress = resolveInitialSyncProgress(syncs);

    const isInzhur = institution.provider === ExternalSourceEnum.INZHUR;
    const statusLine = isNotEmptyArray(syncs) ? <BankIntegrationStatusPill syncs={syncs} /> : null;

    return (
        <View className="gap-y-4xl">
            <View className="items-center gap-y-lg pb-md" testID={InstitutionSelector.Hero}>
                <View style={balanceSlotStyle} />
                {isInzhur ? <InzhurInstitutionGainLine /> : null}
                {isInzhur ? <InzhurFreshnessLine /> : statusLine}
            </View>
            {isInzhur ? <InzhurInstitutionChart /> : null}
            <InstitutionConnectionRow syncs={syncs} />
            {isDefined(progress) ? <SyncImportProgress progress={progress} /> : null}
            {isInzhur ? <InzhurPendingTopUps /> : null}
            {isInzhur ? <InzhurImportStatementAction /> : null}
            <InstitutionAccounts institution={institution} balancesByAccountId={balancesByAccountId} />
        </View>
    );
};
