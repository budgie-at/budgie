import { expect, it } from '@effect/vitest';

import { getEnableBankingLogoSlug } from '../src/@generic/utils/get-enable-banking-logo-slug.util';

import logoNames from './fixture/enable-banking-logo-names.json';

it('resolves every listed bank name to its logo', () => {
    for (const [slug, names] of Object.entries(logoNames)) {
        for (const name of names) {
            expect(getEnableBankingLogoSlug(name)).toBe(slug);
        }
    }
});

it('never gives an unlisted bank a logo', () => {
    for (const name of ['Volksbank Wien', 'Raiffeisenkasse Meran', 'Sparkasse', 'Some Unknown Bank', '']) {
        expect(getEnableBankingLogoSlug(name)).toBeNull();
    }
});
