import { describe, expect, it } from '@effect/vitest';
import { vi } from 'vitest';

import { getImportMatchDescription } from '../src/import/utils/get-import-match-description.util';
import { getImportRequiredFooter } from '../src/import/utils/get-import-required-footer.util';
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

        getImportMatchDescription(
            matchImportColumns(['Account', 'Date', 'Amount'], { Date: ['2026-11-02'], Amount: ['12.50'] }, false),
            {},
            translate
        );

        expect(translate).toHaveBeenLastCalledWith({ message: 'Matched by column name.' });
    });

    it('does not claim a name match for an unsafe amount column', () => {
        const translate = vi.fn<(descriptor: MacroMessageDescriptor | TemplateStringsArray) => string>();

        expect(getImportMatchDescription(matchImportColumns(['Betrag'], { Betrag: ['1.234,56'] }, false), {}, translate)).toBe('');
        expect(translate).not.toHaveBeenCalled();
    });

    it('keeps sample inference separate from validated name matches', () => {
        expect(matchImportColumns(['Amount', 'When'], { Amount: ['12.50'], When: ['2026-11-02'] }, false)).toMatchObject({
            toAmount: 'Amount',
            operatedAt: ''
        });
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

describe('required import footer', () => {
    it('keeps the guidance for an entirely unmapped file', () => {
        const translate = vi.fn<(descriptor: MacroMessageDescriptor | TemplateStringsArray) => string>().mockReturnValue('translated');

        expect(getImportRequiredFooter(5, translate)).toBe('translated');
        expect(translate).toHaveBeenLastCalledWith({ message: 'Pick a column for each field.' });
    });

    it.each([1, 2, 3, 4])('leaves partial-match blocker guidance to the action tray (%i missing)', missingCount => {
        const translate = vi.fn<(descriptor: MacroMessageDescriptor | TemplateStringsArray) => string>();

        expect(getImportRequiredFooter(missingCount, translate)).toBeNull();
        expect(translate).not.toHaveBeenCalled();
    });

    it('keeps the all-matched guidance', () => {
        const translate = vi.fn<(descriptor: MacroMessageDescriptor | TemplateStringsArray) => string>().mockReturnValue('translated');

        expect(getImportRequiredFooter(0, translate)).toBe('translated');
        expect(translate).toHaveBeenLastCalledWith({ message: 'All required fields matched. Tap a field to change it.' });
    });
});
