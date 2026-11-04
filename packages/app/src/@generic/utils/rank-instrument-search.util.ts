import type { InstrumentEntityInterface } from '@budgie/contracts';

export const rankInstrumentSearch = <T extends Pick<InstrumentEntityInterface, 'name' | 'code' | 'symbol'>>(
    instruments: readonly T[],
    search: string
): T[] => {
    const query = search.trim().toLowerCase();
    const matches = instruments.filter(({ name, code, symbol }) => [name, code, symbol].some(value => value.toLowerCase().includes(query)));

    return [...matches.filter(({ code }) => code.toLowerCase() === query), ...matches.filter(({ code }) => code.toLowerCase() !== query)];
};
