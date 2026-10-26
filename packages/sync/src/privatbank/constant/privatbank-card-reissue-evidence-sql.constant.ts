const SECONDS_PER_DAY = 86_400;
const MAX_REISSUE_GAP_DAYS = 45;
const COUNTERPARTY_WINDOW_DAYS = 90;

export const PRIVATBANK_CARD_REISSUE_EVIDENCE_SQL = String.raw`
    successor.first_at - predecessor.last_at <= ${MAX_REISSUE_GAP_DAYS * SECONDS_PER_DAY}
    AND EXISTS (
        SELECT 1 FROM bank_rows predecessor_row
        INNER JOIN bank_rows successor_row ON successor_row.title = predecessor_row.title
        WHERE predecessor_row.account_id = predecessor.account_id
            AND predecessor_row.operated_at >= predecessor.last_at - ${COUNTERPARTY_WINDOW_DAYS * SECONDS_PER_DAY}
            AND successor_row.account_id = successor.account_id
            AND successor_row.operated_at <= successor.first_at + ${COUNTERPARTY_WINDOW_DAYS * SECONDS_PER_DAY}
    )
`;
