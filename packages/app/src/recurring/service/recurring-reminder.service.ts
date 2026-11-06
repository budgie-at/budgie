import { InstrumentRepository, SettingsRepository, convertFromMicroUnits } from '@budgie/contracts';
import { RecurringService } from '@budgie/recurring';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Notifications from 'expo-notifications';

import { isEmptyArray, isDefined } from '@rnw-community/shared';

import { ensureNotificationChannel } from '../../@generic/utils/ensure-notification-channel.util';
import { toNativeCallError } from '../../@generic/utils/to-native-call-error.util';
import { DEFAULT_DECIMAL_PLACES } from '../../i18n/constant/default-decimal-places.constant';
import { formatSymbolAmount } from '../../i18n/utils/format-symbol-amount.util';
import { languageToLocale } from '../../i18n/utils/language-to-locale.util';
import { RecurringNotificationKindEnum } from '../enum/recurring-notification-kind.enum';
import { selectRecurringReminderPlans } from '../utils/select-recurring-reminder-plans.util';

import type { ScheduledLocalNotificationInterface } from '../../@generic/interface/scheduled-local-notification.interface';
import type { RecurringReminderPlanInterface } from '../interface/recurring-reminder-plan.interface';
import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

export class RecurringReminderService extends Context.Service<RecurringReminderService>()('@budgie/app/RecurringReminderService', {
    make: Effect.gen(function* () {
        const recurringService = yield* RecurringService;
        const settingsRepository = yield* SettingsRepository;
        const instrumentRepository = yield* InstrumentRepository;

        const scheduleLocalNotification = Effect.fnUntraced(function* (notification: ScheduledLocalNotificationInterface) {
            yield* ensureNotificationChannel(notification.channel);

            yield* Effect.tryPromise({
                try: () =>
                    Notifications.scheduleNotificationAsync({
                        identifier: notification.identifier,
                        content: { title: notification.title, body: notification.body, data: notification.data },
                        trigger: {
                            type: Notifications.SchedulableTriggerInputTypes.DATE,
                            date: notification.date,
                            channelId: notification.channel.id
                        }
                    }),
                catch: toNativeCallError
            });
        });

        const cancelScheduledLocalNotifications = Effect.fnUntraced(function* (kind: string) {
            const scheduled = yield* Effect.tryPromise({
                try: () => Notifications.getAllScheduledNotificationsAsync(),
                catch: toNativeCallError
            });
            const matching = scheduled.filter(request => request.content.data?.['kind'] === kind);

            yield* Effect.forEach(
                matching,
                request =>
                    Effect.tryPromise({
                        try: () => Notifications.cancelScheduledNotificationAsync(request.identifier),
                        catch: toNativeCallError
                    }),
                { discard: true }
            );
        });

        const buildDueBody = (daysUntilDue: number, amount: string): string => {
            if (daysUntilDue <= 0) {
                return i18n._(msg`${amount} due today`);
            }
            if (daysUntilDue === 1) {
                return i18n._(msg`${amount} due tomorrow`);
            }

            return i18n._(msg`${amount} due in ${daysUntilDue} days`);
        };

        const schedulePlan = Effect.fnUntraced(function* (
            plan: RecurringReminderPlanInterface,
            series: RecurringSeriesListItemInterface,
            formatAmount: (nativeAmount: number, symbol: string) => string
        ) {
            const instrument = isDefined(series.instrumentId) ? yield* instrumentRepository.findById(series.instrumentId) : null;
            const symbol = isDefined(instrument) ? instrument.symbol : '';

            yield* scheduleLocalNotification({
                channel: { id: 'recurring-reminders', name: i18n._(msg`Recurring reminders`) },
                identifier: `recurring-reminder-${plan.seriesId}`,
                title: series.title,
                body: buildDueBody(plan.daysUntilDue, formatAmount(series.nativeAmount, symbol)),
                data: { kind: RecurringNotificationKindEnum.RECURRING, seriesId: plan.seriesId },
                date: plan.scheduledAt
            });
        });

        return {
            reschedule: Effect.fn('RecurringReminderService.reschedule')(function* (now: Date) {
                yield* cancelScheduledLocalNotifications(RecurringNotificationKindEnum.RECURRING);

                const permission = yield* Effect.tryPromise({
                    try: () => Notifications.getPermissionsAsync(),
                    catch: toNativeCallError
                });

                if (permission.status !== Notifications.PermissionStatus.GRANTED) {
                    return;
                }

                const series = yield* recurringService.listSeries(now);
                const plans = selectRecurringReminderPlans(series, now);

                if (isEmptyArray(plans)) {
                    return;
                }

                const settings = yield* settingsRepository.getSettings();
                const decimalPlaces = settings.showCents ? DEFAULT_DECIMAL_PLACES : 0;
                const numberFormatter = new Intl.NumberFormat(languageToLocale(settings.language), {
                    style: 'decimal',
                    minimumFractionDigits: decimalPlaces,
                    maximumFractionDigits: decimalPlaces
                });
                const formatAmount = (nativeAmount: number, symbol: string): string =>
                    formatSymbolAmount(convertFromMicroUnits(nativeAmount), symbol, absolute => numberFormatter.format(absolute));
                const seriesById = new Map(series.map(item => [item.id, item]));

                yield* Effect.forEach(
                    plans,
                    plan => {
                        const item = seriesById.get(plan.seriesId);

                        return isDefined(item) ? schedulePlan(plan, item, formatAmount) : Effect.void;
                    },
                    { discard: true }
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(RecurringReminderService, RecurringReminderService.make).pipe(
        Layer.provide([RecurringService.layer, SettingsRepository.layer, InstrumentRepository.layer])
    );
}
