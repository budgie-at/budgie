export const TRANSFER_PAIR_AVAILABLE_EXCHANGE_RATES_SQL = `
            latest_exchange_rates AS (
                SELECT
                    base_instrument_id,
                    quote_instrument_id,
                    rate * 1.0 as rate,
                    ROW_NUMBER() OVER (
                        PARTITION BY base_instrument_id, quote_instrument_id
                        ORDER BY created_at DESC
                    ) as exchangeRateRank
                FROM exchange_rates
                WHERE deleted_at IS NULL
                    AND rate > 0
            ),
            direct_exchange_rates AS (
                SELECT base_instrument_id, quote_instrument_id, rate, 0 as direction
                FROM latest_exchange_rates
                WHERE exchangeRateRank = 1
                UNION ALL
                SELECT quote_instrument_id as base_instrument_id, base_instrument_id as quote_instrument_id, 1.0 / rate as rate, 1 as direction
                FROM latest_exchange_rates
                WHERE exchangeRateRank = 1
            ),
            base_triangulated_rates AS (
                SELECT
                    first_leg.base_instrument_id as base_instrument_id,
                    second_leg.quote_instrument_id as quote_instrument_id,
                    first_leg.rate * second_leg.rate as rate, 2 as direction
                FROM direct_exchange_rates first_leg
                INNER JOIN direct_exchange_rates second_leg
                    ON first_leg.quote_instrument_id = second_leg.base_instrument_id
                WHERE first_leg.quote_instrument_id = (SELECT default_instrument_id FROM settings LIMIT 1)
                    AND first_leg.base_instrument_id != second_leg.quote_instrument_id
            ),
            available_exchange_rates AS (
                SELECT base_instrument_id, quote_instrument_id, rate FROM (
                    SELECT
                        base_instrument_id,
                        quote_instrument_id,
                        rate,
                        ROW_NUMBER() OVER (
                            PARTITION BY base_instrument_id, quote_instrument_id
                            ORDER BY direction
                        ) as directionRank
                    FROM (
                        SELECT base_instrument_id, quote_instrument_id, rate, direction FROM direct_exchange_rates
                        UNION ALL
                        SELECT base_instrument_id, quote_instrument_id, rate, direction FROM base_triangulated_rates
                    )
                )
                WHERE directionRank = 1
            ),
`;
