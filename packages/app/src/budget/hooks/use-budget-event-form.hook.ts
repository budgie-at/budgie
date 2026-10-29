import { BudgetService } from '@budgie/budget';
import { convertFromMicroUnits } from '@budgie/contracts';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useLingui } from '@lingui/react/macro';
import { addDays } from 'date-fns/addDays';
import { startOfDay } from 'date-fns/startOfDay';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { useForm } from 'react-hook-form';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { useToday } from '../../@generic/hook/use-today.hook';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { BudgetEventFormSchema, BudgetEventFormValues } from '../constant/budget-event-form-schema.constant';
import { useGetBudgetCategoryLimitsQuery } from '../query/use-get-budget-category-limits.query';
import { useGetEventBudgetQuery } from '../query/use-get-event-budget.query';
import { buildBudgetEventPayload } from '../utils/build-budget-event-payload.util';

import type { BudgetCategoryLimitEntityInterface, BudgetEntityInterface } from '@budgie/contracts';

const EVENT_DEFAULT_LENGTH_DAYS = 13;
const FALLBACK_ROUTE = '/budget' as const;

interface UseBudgetEventFormOptionsInterface {
    readonly defaultInstrumentId: number;
    readonly editingId: number | null;
}

const buildEventFormValues = (
    event: BudgetEntityInterface,
    categoryLimits: readonly BudgetCategoryLimitEntityInterface[]
): BudgetEventFormValues => ({
    name: event.name,
    tagId: isDefined(event.tagId) ? event.tagId : 0,
    startsAtMs: isDefined(event.startsAt) ? event.startsAt.getTime() : 0,
    endsAtMs: isDefined(event.endsAt) ? event.endsAt.getTime() : 0,
    overallLimit: convertFromMicroUnits(event.overallLimit),
    categoryLimits: categoryLimits.map(limit => ({
        categoryId: limit.categoryId,
        limitAmount: convertFromMicroUnits(limit.limitAmount),
        rolloverMode: limit.rolloverMode
    })),
    instrumentId: event.instrumentId
});

export const useBudgetEventForm = ({ defaultInstrumentId, editingId }: UseBudgetEventFormOptionsInterface) => {
    const { t } = useLingui();
    const { run } = useSingleFlight();
    const today = useToday();
    const isEditing = isPositiveNumber(editingId);
    const { budget: event, isLoading: isEventLoading } = useGetEventBudgetQuery(isEditing ? editingId : 0);
    const { categoryLimits, isLoading: isCategoryLimitsLoading } = useGetBudgetCategoryLimitsQuery(isEditing ? editingId : null);
    const startOfToday = startOfDay(today);

    const defaultValues: BudgetEventFormValues = {
        name: '',
        tagId: 0,
        startsAtMs: startOfToday.getTime(),
        endsAtMs: addDays(startOfToday, EVENT_DEFAULT_LENGTH_DAYS).getTime(),
        overallLimit: 0,
        categoryLimits: [],
        instrumentId: defaultInstrumentId
    };

    const form = useForm<BudgetEventFormValues>({
        mode: 'onChange',
        resolver: standardSchemaResolver(Schema.toStandardSchemaV1(BudgetEventFormSchema)),
        defaultValues,
        values: isEditing && isDefined(event) && !isCategoryLimitsLoading ? buildEventFormValues(event, categoryLimits) : defaultValues,
        resetOptions: { keepDirtyValues: true, keepErrors: true }
    });

    const handleSubmit = () => {
        void form.handleSubmit(values =>
            run(
                Effect.gen(function* () {
                    const payload = buildBudgetEventPayload(values);
                    const budgetService = yield* BudgetService;

                    if (isPositiveNumber(editingId)) {
                        yield* budgetService.updateBudget(editingId, payload);
                    } else {
                        yield* budgetService.createBudget(payload);
                    }

                    goBackOrReplace(FALLBACK_ROUTE);
                }).pipe(toastOnFailure(isEditing ? t`Could not save event` : t`Could not create event`))
            )
        )();
    };

    const handleCancel = () => {
        goBackOrReplace(FALLBACK_ROUTE);
    };

    const handleDelete = () =>
        run(
            Effect.gen(function* () {
                const confirmed = yield* confirmAlert({
                    title: t`Delete event?`,
                    message: t`This removes the event budget. Your transactions are not affected.`,
                    confirmText: t`Delete`,
                    cancelText: t`Cancel`,
                    isDestructive: true
                });

                if (!confirmed || !isPositiveNumber(editingId)) {
                    return;
                }

                const budgetService = yield* BudgetService;

                yield* budgetService.deleteBudget(editingId);
                goBackOrReplace(FALLBACK_ROUTE);
            }).pipe(toastOnFailure(t`Could not delete event`))
        );

    return {
        form,
        handleSubmit,
        handleDelete,
        handleCancel,
        isEditing,
        isLoading: isEditing && (isEventLoading || isCategoryLimitsLoading || !isDefined(event))
    };
};
