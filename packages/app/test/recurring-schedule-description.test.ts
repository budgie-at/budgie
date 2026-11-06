import { RecurringCadenceUnitEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import { vi } from 'vitest';

import { useRecurringScheduleDescription } from '../src/recurring/hook/use-recurring-schedule-description.hook';

vi.mock('@lingui/react/macro', () => ({
    useLingui: () => ({
        t: (strings: TemplateStringsArray, ...values: (string | number)[]) =>
            strings.reduce((result, part, index) => `${result}${part}${values[index] ?? ''}`, '')
    })
}));
vi.mock('../src/i18n/hook/use-format-date.hook', () => ({
    useFormatDate: () => ({
        formatWeekday: (date: Date) => date.toLocaleDateString('en-US', { weekday: 'long' }),
        formatMonthAndDay: (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })
}));
vi.mock('../src/recurring/hook/use-recurring-cadence-label.hook', () => ({
    useRecurringCadenceLabel: () => () => 'Cadence fallback'
}));

it.each([new Date(2027, 1, 28), new Date(2027, 2, 31), new Date(2027, 3, 30)])(
    'describes the monthly anchor regardless of the next clamped occurrence %s',
    nextDate => {
        expect(
            useRecurringScheduleDescription()(
                { cadenceUnit: RecurringCadenceUnitEnum.MONTH, cadenceInterval: 1, nextDate },
                new Date(2027, 0, 31)
            )
        ).toBe('Every month on day 31');
    }
);

it('describes the leap-day anchor in a common year', () => {
    expect(
        useRecurringScheduleDescription()(
            { cadenceUnit: RecurringCadenceUnitEnum.YEAR, cadenceInterval: 1, nextDate: new Date(2027, 1, 28) },
            new Date(2024, 1, 29)
        )
    ).toBe('Every year on Feb 29');
});

it.each([
    { cadenceUnit: RecurringCadenceUnitEnum.MONTH, cadenceInterval: 1, nextDate: null },
    { cadenceUnit: RecurringCadenceUnitEnum.MONTH, cadenceInterval: 2, nextDate: new Date(2027, 1, 28) }
])('preserves the cadence fallback for %s', series => {
    expect(useRecurringScheduleDescription()(series, new Date(2027, 0, 31))).toBe('Cadence fallback');
});
