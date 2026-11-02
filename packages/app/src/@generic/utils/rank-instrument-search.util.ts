import type { InstrumentEntityInterface } from '@budgie/contracts';

type SearchableInstrument = Pick<InstrumentEntityInterface, 'name' | 'code' | 'symbol'>;

export const rankInstrumentSearch = <T extends SearchableInstrument>(instruments: readonly T[], search: string): T[] => {
    const query = search.trim().toLowerCase();
    const matches = instruments.filter(({ name, code, symbol }) => [name, code, symbol].some(value => value.toLowerCase().includes(query)));

    return [...matches.filter(({ code }) => code.toLowerCase() === query), ...matches.filter(({ code }) => code.toLowerCase() !== query)];
};
