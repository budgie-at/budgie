import { AccountAssociationEnum, AccountWithSyncEntityInterface } from '@budgie/contracts';
import { resolveInitialSyncProgress } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { SyncImportProgress } from '../../../sync/component/sync-import-progress/sync-import-progress';
import { ACCOUNT_SYNC_STATE_LABEL } from '../../constant/account-sync-state-label.constant';
import { AccountSyncStateEnum } from '../../enum/account-sync-state.enum';
import { getAccountSyncState } from '../../utils/get-account-sync-state.util';

import type { ReactNode } from 'react';

interface Props {
    readonly accounts: readonly Pick<AccountWithSyncEntityInterface, AccountAssociationEnum.SYNC>[];
    readonly children: ReactNode;
}

const ISSUE_STATES = [AccountSyncStateEnum.FAILED, AccountSyncStateEnum.SYNCING] as const;

export const InstitutionRowDetail = ({ accounts, children }: Props) => {
    const { t } = useLingui();

    const syncStates = new Set(accounts.map(account => getAccountSyncState(account.sync)));
    const issueState = ISSUE_STATES.find(state => syncStates.has(state));
    const issueLabel = isDefined(issueState) ? ` · ${t(ACCOUNT_SYNC_STATE_LABEL[issueState])}` : null;
    const toneClassName = issueState === AccountSyncStateEnum.FAILED ? 'text-destructive-foreground' : 'text-secondary-foreground';
    const importProgress = resolveInitialSyncProgress(accounts.map(account => account.sync));

    return (
        <>
            <Text className={cn('text-[13px]', toneClassName)} maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER} numberOfLines={2}>
                {children}
                {issueLabel}
            </Text>
            {isDefined(importProgress) ? <SyncImportProgress progress={importProgress} /> : null}
        </>
    );
};
