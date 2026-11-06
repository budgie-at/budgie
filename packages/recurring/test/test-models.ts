import {
    RecurringMatchSourceEnum,
    RecurringSeriesSourceEnum,
    RecurringSeriesStatusEnum,
    RecurringSeriesUserStateEnum
} from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { scoreDetectedSeries } from '../src/series/recurring-confidence';
import { buildDetectedSchedule } from '../src/series/recurring-detected-schedule';

import type { RecurringChargeInterface } from '../src/interface/recurring-charge.interface';
import type { RecurringReadModelInterface } from '../src/interface/recurring-read-model.interface';
import type { RecurringSeriesInterface } from '../src/interface/recurring-series.interface';

const EPOCH = new Date(0);

export const buildReadModels = (
    detected: readonly RecurringSeriesInterface[],
    charges: readonly RecurringChargeInterface[],
    userState: RecurringSeriesUserStateEnum = RecurringSeriesUserStateEnum.SUGGESTED
): RecurringReadModelInterface[] =>
    detected.map((series, index) => ({
        series: {
            id: index + 1,
            createdAt: EPOCH,
            updatedAt: EPOCH,
            deletedAt: null,
            merchantKey: series.merchantKey,
            kind: series.kind,
            periodDays: Math.round(series.periodDays),
            amount: series.nativeAmount,
            status: RecurringSeriesStatusEnum.ACTIVE,
            userState,
            title: series.title,
            categoryId: series.categoryId,
            lastSeenAt: new Date(series.anchorTimestamp),
            source: RecurringSeriesSourceEnum.DETECTED,
            accountId: null,
            ...buildDetectedSchedule(series),
            instrumentId: series.instrumentId,
            endsAt: null,
            reminderDaysBefore: null,
            confidence: scoreDetectedSeries(series),
            defaultAmount: series.nativeAmount,
            categoryTitle: null,
            categoryIcon: null
        },
        links: series.events
            .map(event => charges.find(item => item.transactionId === event.transactionId && item.kind === series.kind))
            .filter(isDefined)
            .map(charge => ({
                charge,
                link: {
                    id: charge.transactionId,
                    createdAt: EPOCH,
                    updatedAt: EPOCH,
                    deletedAt: null,
                    seriesId: index + 1,
                    transactionId: charge.transactionId,
                    cycleDate: charge.operatedAt,
                    matchedBy: RecurringMatchSourceEnum.AUTO,
                    isExcluded: false
                }
            }))
    }));
