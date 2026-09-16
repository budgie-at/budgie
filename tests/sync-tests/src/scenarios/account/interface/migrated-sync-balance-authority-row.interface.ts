export interface MigratedSyncBalanceAuthorityRowInterface {
    readonly balance_authority: string;
    readonly balance_anchor_captured_at: number | null;
    readonly balance_adjustment_transaction_id: number | null;
    readonly backward_batch_sequence: number | null;
}
