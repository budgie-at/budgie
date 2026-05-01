import { UserIconNameEnum, transactionAsync } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { bankSyncRepository, db, transactionRepository } from '../../../@generic/drizzle/db/db';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { unconsolidateByIdInTransaction } from '../../../transaction/utils/unconsolidate-by-id-in-transaction.util';

import type { ResyncBankSyncAccountPropsInterface } from '../../interface/resync-bank-sync-account-props.interface';

export const ResyncBankSyncAccount = ({ accountId }: ResyncBankSyncAccountPropsInterface) => {
    const { t } = useLingui();
    const [isLoading, setIsLoading] = useState(false);

    const handleResync = async () => {
        const confirmed = await confirmAlert({
            title: t`Re-sync Bank Account?`,
            message: t`This will reset the sync history and re-sync all transactions from this bank account. Your existing transactions, tags, and categories will be preserved and updated with any new data.`,
            confirmText: t`Re-sync History`,
            cancelText: t`Cancel`
        });

        if (!confirmed) {
            return;
        }

        setIsLoading(true);
        try {
            await transactionAsync(db, async tx => {
                const canonicals = await transactionRepository.findActiveAutoConsolidatedByAccountIds([accountId], tx);
                for (const canonical of canonicals) {
                    // eslint-disable-next-line no-await-in-loop -- Sequential unconsolidation must precede the resync reset
                    await unconsolidateByIdInTransaction(canonical.id, tx);
                }

                await bankSyncRepository.resetForResync(accountId, tx);
            });
            Toast.show({
                type: 'success',
                text1: t`Success`,
                text2: t`Bank sync has been reset. History will be re-synced on next sync.`
            });
        } catch (error: unknown) {
            Toast.show({
                type: 'error',
                text1: t`Something went wrong`,
                text2: getErrorMessage(error)
            });
        } finally {
            setIsLoading(false);
        }
    };

    return <Button onPress={handleResync} isLoading={isLoading} size="sm" variant="positive" leftIcon={UserIconNameEnum.RotateCw} />;
};
