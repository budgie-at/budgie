import { useLingui } from '@lingui/react/macro';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ConfirmActionBottomSheet } from '../../../@generic/components/confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { accountBalanceRepository } from '../../../@generic/drizzle/db/db';
import { accountBalanceIncrementalService } from '../../../account/service/account-balance-incremental.service';
import { useConfirmAction } from '../../hook/use-confirm-action.hook';
import { SettingsCard } from '../settings-card/settings-card';

export const RecalculateBalances = () => {
    const { t } = useLingui();

    const handleRecalculate = async () => {
        await accountBalanceRepository.truncate();
        await accountBalanceIncrementalService.updateAllBalances();
    };

    const { ref, isLoading, handleOpen, handleConfirm } = useConfirmAction(handleRecalculate);

    return (
        <>
            <SettingsCard
                onPress={handleOpen}
                title={t`Recalculate Balances`}
                description={t`Clear cached balances and recalculate from transactions`}
                left={<CircleIcon size="1_5xl" icon={ICONS.RefreshCw} variant="secondary" border={false} />}
            />

            <ConfirmActionBottomSheet
                ref={ref}
                isLoading={isLoading}
                variant="default"
                description={t`This will clear all cached account balances and recalculate them from your transactions. This may take a moment.`}
                buttonText={t`Recalculate`}
                onSubmit={handleConfirm}
                icon="RefreshCw"
                title={t`Recalculate Balances`}
            />
        </>
    );
};
