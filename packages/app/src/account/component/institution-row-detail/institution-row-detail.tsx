import { AccountAssociationEnum, AccountWithSyncEntityInterface } from '@budgie/contracts';
import { resolveInitialSyncProgress } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { SyncImportProgress } from '../../../sync/component/sync-import-progress/sync-import-progress';
import { ACCOUNT_SYNC_STATE_LABEL } from '../../constant/account-sync-state-label.constant';
import { AccountSyncStateEnum } from '../../enum/account-sync-state.enum';
import { getAccountSyncState } from '../../utils/get-account-sync-state.util';

interface Props {
    readonly accounts: readonly Pick<AccountWithSyncEntityInterface, AccountAssociationEnum.SYNC>[];
    readonly accountsCountLabel: string;
}

const ISSUE_STATES = [AccountSyncStateEnum.FAILED, AccountSyncStateEnum.SYNCING] as const;

export const InstitutionRowDetail = ({ accounts, accountsCountLabel }: Props) => {
    const { t } = useLingui();

    const syncStates = new Set(accounts.map(account => getAccountSyncState(account.sync)));
    const issueState = ISSUE_STATES.find(state => syncStates.has(state));
    const detail = isDefined(issueState) ? `${accountsCountLabel} · ${t(ACCOUNT_SYNC_STATE_LABEL[issueState])}` : accountsCountLabel;
    const toneClassName = issueState === AccountSyncStateEnum.FAILED ? 'text-destructive-foreground' : 'text-secondary-foreground';
    const importProgress = resolveInitialSyncProgress(accounts.map(account => account.sync));

    return (
        <>
            <Text className={cn('text-[13px]', toneClassName)} maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER} numberOfLines={2}>
                {detail}
            </Text>
            {isDefined(importProgress) ? <SyncImportProgress progress={importProgress} /> : null}
        </>
    );
};
