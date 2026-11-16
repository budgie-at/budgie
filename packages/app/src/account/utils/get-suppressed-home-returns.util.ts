import type { HomeHoldingInterface } from '../interface/home-holding.interface';

export const getSuppressedHomeReturns = (
    sections: readonly { readonly holdings: readonly Pick<HomeHoldingInterface, 'instrument'>[] }[]
): ReadonlySet<number> =>
    new Set(sections.flatMap(({ holdings }) => (holdings.length === 1 ? holdings.map(holding => holding.instrument.id) : [])));
