import { describe, expect, it } from '@effect/vitest';
import { vi } from 'vitest';

import { getImportMatchDescription } from '../src/import/utils/get-import-match-description.util';
import { matchImportColumns } from '../src/import/utils/match-import-columns.util';

import type { MacroMessageDescriptor } from '@lingui/core/macro';

vi.mock('@lingui/core/macro', () => ({
    msg: (strings: TemplateStringsArray, ...values: readonly string[]) => ({
        message: strings.reduce((message, part, index) => message + (values[index - 1] ?? '') + part, '')
    })
}));

describe('import match description', () => {
    it('leaves unmatched files without a match claim', () => {
        const translate = vi.fn<(descriptor: MacroMessageDescriptor | TemplateStringsArray) => string>();

        expect(getImportMatchDescription(matchImportColumns(['Unknown']), {}, translate)).toBe('');
        expect(translate).not.toHaveBeenCalled();
    });

    it('describes column-name matches without claiming sample inference', () => {
        const translate = vi.fn<(descriptor: MacroMessageDescriptor | TemplateStringsArray) => string>().mockReturnValue('translated');

        getImportMatchDescription(matchImportColumns(['Account', 'Date', 'Amount']), {}, translate);

        expect(translate).toHaveBeenLastCalledWith({ message: 'Matched by column name.' });
    });

    it('describes mixed name and sample matches', () => {
        const translate = vi.fn<(descriptor: MacroMessageDescriptor | TemplateStringsArray) => string>().mockReturnValue('translated');

        getImportMatchDescription(matchImportColumns(['Account', 'When']), { operatedAt: 'When' }, translate);

        expect(translate).toHaveBeenLastCalledWith({ message: 'Matched by column name and sample values.' });
    });

    it('lists sample-only fields with a translated conjunction', () => {
        const translate = vi
            .fn<(descriptor: MacroMessageDescriptor | TemplateStringsArray) => string>()
            .mockReturnValueOnce('Date')
            .mockReturnValueOnce('amount')
            .mockReturnValue('translated');

        getImportMatchDescription(matchImportColumns(['When', 'Value']), { operatedAt: 'When', toAmount: 'Value' }, translate);

        expect(translate).toHaveBeenLastCalledWith({ message: 'Date and amount matched from sample values.' });
    });

    it('uses a capitalized label for a single sample-only field', () => {
        const translate = vi
            .fn<(descriptor: MacroMessageDescriptor | TemplateStringsArray) => string>()
            .mockReturnValueOnce('Currency')
            .mockReturnValue('translated');

        getImportMatchDescription(matchImportColumns(['Unit']), { toCurrency: 'Unit' }, translate);

        expect(translate).toHaveBeenLastCalledWith({ message: 'Currency matched from sample values.' });
    });
});
