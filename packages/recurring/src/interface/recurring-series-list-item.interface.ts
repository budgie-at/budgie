import type { RecurringAlertEnum } from '../enum/recurring-alert.enum';
import type {
    RecurringCadenceUnitEnum,
    RecurringSeriesKindEnum,
    RecurringSeriesSourceEnum,
    RecurringSeriesUserStateEnum,
    UserIconType
} from '@budgie/contracts';

export interface RecurringSeriesListItemInterface {
    readonly id: number;
    readonly title: string;
    readonly kind: RecurringSeriesKindEnum;
    readonly source: RecurringSeriesSourceEnum;
    readonly userState: RecurringSeriesUserStateEnum;
    readonly isActive: boolean;
    readonly confidence: number;
    readonly cadenceUnit: RecurringCadenceUnitEnum;
    readonly cadenceInterval: number;
    readonly nextDate: Date | null;
    readonly amount: number;
    readonly nativeAmount: number;
    readonly monthlyEquivalent: number;
    readonly alert: RecurringAlertEnum | null;
    readonly categoryId: number | null;
    readonly categoryTitle: string | null;
    readonly categoryIcon: UserIconType | null;
    readonly accountId: number | null;
    readonly instrumentId: number | null;
    readonly endsAt: Date | null;
    readonly reminderDaysBefore: number | null;
    readonly linkedCount: number;
}
