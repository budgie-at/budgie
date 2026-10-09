import { SyncModeEnum, TransactionTypeEnum } from '@budgie/contracts';

export const buildCalibratedTransferExclusionSql = (transactionAlias: string, accountIdsSql: string): string => `NOT EXISTS (
    SELECT 1
    FROM bank_syncs calibrated_sync
    LEFT JOIN transactions calibrated_adjustment ON
        calibrated_adjustment.id = calibrated_sync.balance_adjustment_transaction_id
        AND calibrated_adjustment.deleted_at IS NULL
        AND calibrated_adjustment.updated_by IS NULL
        AND calibrated_adjustment.type = '${TransactionTypeEnum.ADJUSTMENT}'
        AND (
            calibrated_adjustment.from_account_id = calibrated_sync.account_id
            OR calibrated_adjustment.to_account_id = calibrated_sync.account_id
        )
    WHERE calibrated_sync.account_id IN (${accountIdsSql})
        AND calibrated_sync.deleted_at IS NULL
        AND calibrated_sync.mode = '${SyncModeEnum.FORWARD}'
        AND calibrated_sync.setup_balance IS NULL
        AND calibrated_sync.forward_sync_from_at IS NOT NULL
        AND ${transactionAlias}.operated_at <= calibrated_sync.forward_sync_from_at
        AND (
            (
                calibrated_sync.balance_adjustment_transaction_id IS NOT NULL
                AND calibrated_adjustment.id IS NOT NULL
                AND ${transactionAlias}.created_at <= MAX(calibrated_adjustment.created_at, calibrated_adjustment.updated_at)
            )
            OR (
                calibrated_sync.balance_adjustment_transaction_id IS NULL
                AND ${transactionAlias}.created_at <= calibrated_sync.forward_sync_from_at
            )
        )
)`;
