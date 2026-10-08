import { PRECISION } from '@budgie/contracts';

export const DUPLICATE_TRANSFER_REPAIR_MIGRATION = '20261009005433_duplicate_transfer_repair';
export const MONEY_MOVING_DATA_MIGRATION_REASONS = {
    [DUPLICATE_TRANSFER_REPAIR_MIGRATION]: 'repairs a duplicate bridge and transfer-pair canonical once while preserving raw originals'
} as const;
export const OPERATED_AT = new Date('2025-06-01T12:00:00.000Z');
export const DUPLICATE_OPERATED_AT = new Date('2026-10-06T12:00:00.000Z');
export const DUPLICATE_CREATED_AT = 1_791_496_204;
export const ADJUSTMENT_CREATED_AT = DUPLICATE_CREATED_AT - 300;
export const BALANCE_UPDATED_AT = DUPLICATE_CREATED_AT + 300;
export const SOURCE_AMOUNT = 100 * PRECISION;
export const TARGET_AMOUNT = 500 * PRECISION;
export const PRE_ADJUSTMENT_CREATED_AT = ADJUSTMENT_CREATED_AT - 300;
