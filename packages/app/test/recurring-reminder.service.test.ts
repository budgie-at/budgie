import {
    InstrumentRepository,
    InstrumentTypeEnum,
    RecurringCadenceUnitEnum,
    RecurringSeriesKindEnum,
    RecurringSeriesSourceEnum,
    RecurringSeriesUserStateEnum,
    SettingsRepository,
    convertToMicroUnits
} from '@budgie/contracts';
import { RecurringService } from '@budgie/recurring';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { vi } from 'vitest';

import { RecurringReminderService } from '../src/recurring/service/recurring-reminder.service';
import { DEFAULT_SETTINGS } from '../src/settings/constants/default-settings.constant';

import { inertDbLayer } from './fixture/inert-db-layer';

import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

const native = vi.hoisted(() => {
    const scheduled: unknown[] = [];
    const instrumentReads: number[] = [];

    return { scheduled, channelEnsures: 0, instrumentReads };
});

vi.mock('@lingui/core/macro', () => ({
    msg: (parts: TemplateStringsArray, ...values: unknown[]) =>
        parts.reduce((text, part, index) => `${text}${String(values[index - 1])}${part}`)
}));
vi.mock('@lingui/core', () => ({ i18n: { _: (message: string) => message } }));
vi.mock('../src/@generic/utils/ensure-notification-channel.util', async () => {
    const Effect = await import('effect/Effect');

    return {
        ensureNotificationChannel: () =>
            Effect.sync(() => {
                native.channelEnsures += 1;
            })
    };
});
vi.mock('expo-notifications', () => ({
    PermissionStatus: { GRANTED: 'granted' },
    SchedulableTriggerInputTypes: { DATE: 'date' },
    getPermissionsAsync: () => Promise.resolve({ status: 'granted' }),
    getAllScheduledNotificationsAsync: () => Promise.resolve([]),
    cancelScheduledNotificationAsync: () => Promise.resolve(),
    scheduleNotificationAsync: (request: unknown) => {
        native.scheduled.push(request);

        return Promise.resolve();
    }
}));

const series = (id: number, instrumentId: number | null, reminderDaysBefore: number): RecurringSeriesListItemInterface => ({
    id,
    instrumentId,
    reminderDaysBefore,
    title: `Bill ${id}`,
    nextDate: new Date(2026, 10, 10),
    kind: RecurringSeriesKindEnum.EXPENSE,
    source: RecurringSeriesSourceEnum.MANUAL,
    userState: RecurringSeriesUserStateEnum.CONFIRMED,
    isActive: true,
    confidence: 100,
    cadenceUnit: RecurringCadenceUnitEnum.MONTH,
    cadenceInterval: 1,
    amount: id,
    nativeAmount: convertToMicroUnits(id * 10),
    monthlyEquivalent: id,
    alert: null,
    priceChange: null,
    categoryId: null,
    categoryTitle: null,
    categoryIcon: null,
    accountId: null,
    endsAt: null,
    linkedCount: 0
});

const allSeries = [series(1, 1, 1), series(2, 1, 2), series(3, 2, 3), series(4, 2, 0), series(5, null, 1)];

const symbols: Record<number, string> = { 1: '$', 2: '€' };

const testLayer = Layer.mergeAll(
    Layer.mock(RecurringService)({ listSeries: () => Effect.succeed(allSeries) }),
    Layer.mock(SettingsRepository)({ getSettings: () => Effect.succeed(DEFAULT_SETTINGS) }),
    Layer.mock(InstrumentRepository)({
        findById: id =>
            Effect.sync(() => {
                native.instrumentReads.push(id);

                return {
                    id,
                    createdAt: new Date(0),
                    updatedAt: new Date(0),
                    deletedAt: null,
                    type: InstrumentTypeEnum.FIAT,
                    code: `C${id}`,
                    name: `Instrument ${id}`,
                    symbol: symbols[id] ?? '?',
                    priceProvider: null,
                    providerInstrumentId: null,
                    marketCapRank: null
                };
            })
    })
);

const channel = { id: 'recurring-reminders', name: 'Recurring reminders' };

const expectedNotification = (id: number, body: string, scheduledDay: number) => ({
    identifier: `recurring-reminder-${id}`,
    content: { title: `Bill ${id}`, body, data: { kind: 'recurring', seriesId: id } },
    trigger: { type: 'date', date: new Date(2026, 10, scheduledDay, 9), channelId: channel.id }
});

it.effect('reconciles reminders with one channel call and one read per distinct instrument', () =>
    Effect.gen(function* () {
        native.scheduled.length = 0;
        native.channelEnsures = 0;
        native.instrumentReads.length = 0;

        const reminderService = yield* RecurringReminderService.make;
        yield* reminderService.reschedule(new Date(2026, 10, 1));

        expect(native.scheduled).toEqual([
            expectedNotification(3, '€30.00 due in 3 days', 7),
            expectedNotification(2, '$20.00 due in 2 days', 8),
            expectedNotification(1, '$10.00 due tomorrow', 9),
            expectedNotification(5, '50.00 due tomorrow', 9),
            expectedNotification(4, '€40.00 due today', 10)
        ]);
        expect(native.channelEnsures).toBe(1);
        expect([...native.instrumentReads].sort((left, right) => left - right)).toEqual([1, 2]);
    }).pipe(Effect.provide(Layer.merge(testLayer, inertDbLayer)))
);
