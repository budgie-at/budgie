import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { bankSyncRepository } from '../../../@generic/drizzle/db/db';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';

interface Props {
    readonly accountId: number;
}

export const ResyncBankSyncAccount = ({ accountId }: Props) => {
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
            await bankSyncRepository.resetForResync(accountId);
            Toast.show({
                type: 'success',
                text1: t`Success`,
                text2: t`Bank sync has been reset. History will be re-synced on next sync.`
            });
        } catch (error) {
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
