 
import { ExchangeRateEntityTable, InstrumentEntityTable } from '@budgie/contracts';
import { and, eq } from 'drizzle-orm';



import { db } from '../../drizzle/db/db';

const EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';
const RATE_PRECISION_MULTIPLIER = 1_000_000;

interface ExchangeRateApiResponse {
    base: string;
    date: string;
    rates: Record<string, number>;
}

const fetchExchangeRates = async (): Promise<ExchangeRateApiResponse | null> => {
    try {
        const response = await fetch(EXCHANGE_RATE_API_URL);

        if (!response.ok) {
            return null;
        }

        const data = (await response.json()) as ExchangeRateApiResponse;

        return data;
    } catch {
        return null;
    }
};

const getInstrumentIdByCode = async (code: string): Promise<number | null> => {
    try {
        const instruments = await db.select().from(InstrumentEntityTable).where(eq(InstrumentEntityTable.code, code)).limit(1);

        if (instruments.length === 0) {
            return null;
        }

        return instruments[0].id;
    } catch {
        return null;
    }
};

const updateOrInsertExchangeRate = async (
    baseInstrumentId: number,
    instrumentId: number,
    rateInteger: number
): Promise<void> => {
    const existingRates = await db
        .select()
        .from(ExchangeRateEntityTable)
        .where(
            and(eq(ExchangeRateEntityTable.baseInstrumentId, baseInstrumentId), eq(ExchangeRateEntityTable.quoteInstrumentId, instrumentId))
        )
        .limit(1);

    if (existingRates.length > 0) {
        await db
            .update(ExchangeRateEntityTable)
            .set({
                rate: rateInteger,
                source: 'exchangerate-api.com'
            })
            .where(eq(ExchangeRateEntityTable.id, existingRates[0].id));
    } else {
        await db.insert(ExchangeRateEntityTable).values({
            baseInstrumentId,
            quoteInstrumentId: instrumentId,
            rate: rateInteger,
            source: 'exchangerate-api.com'
        });
    }
};

export const syncExchangeRates = async (): Promise<void> => {
    try {
        const apiData = await fetchExchangeRates();

        if (!apiData) {
            return;
        }

        const baseInstrumentId = await getInstrumentIdByCode('USD');

        if (!baseInstrumentId) {
            return;
        }

        const instruments = await db.select().from(InstrumentEntityTable);

        const updates = instruments
            .filter((instrument) => instrument.code !== 'USD')
            .map(async (instrument) => {
                const rate = apiData.rates[instrument.code];

                if (!rate) {
                    return;
                }

                const rateInteger = Math.round(rate * RATE_PRECISION_MULTIPLIER);

                try {
                    await updateOrInsertExchangeRate(baseInstrumentId, instrument.id, rateInteger);
                } catch {
                    // Ignore errors for individual instruments
                }
            });

        await Promise.all(updates);
    } catch {
        // Ignore errors
    }
};
