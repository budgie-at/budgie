import { BudgetService, budgetComputeAllocation } from '@budgie/budget';
import { BudgetLimitSourceEnum, BudgetPeriodEnum, BudgetRolloverModeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { useForm } from 'react-hook-form';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { BudgetFormSchema, BudgetFormValues } from '../constant/budget-form-schema.constant';
import { BudgetTemplateKindEnum } from '../enum/budget-template-kind.enum';
import { useGetActiveBudgetQuery } from '../query/use-get-active-budget.query';
import { useGetBudgetCategoryLimitsQuery } from '../query/use-get-budget-category-limits.query';
import { buildBudgetPayload } from '../utils/build-budget-payload.util';

import { useBudgetTemplateDraft } from './use-budget-template-draft.hook';

import type { BudgetTemplateDraftInterface } from '@budgie/budget';
import type { BudgetCategoryLimitEntityInterface, BudgetEntityInterface } from '@budgie/contracts';

const DEFAULT_PERIOD_START_DAY = 1;
const EDITING_FALLBACK_ROUTE = '/budget' as const;
const DEFAULT_FALLBACK_ROUTE = '/' as const;

interface UseBudgetFormOptionsInterface {
    readonly defaultInstrumentId: number;
    readonly editingId: number | null;
    readonly templateKind?: BudgetTemplateKindEnum | null;
}

const buildBudgetFormValues = (
    budget: BudgetEntityInterface,
    categoryLimits: readonly BudgetCategoryLimitEntityInterface[]
): BudgetFormValues => ({
    name: budget.name,
    period: budget.period,
    periodStartDay: budget.periodStartDay,
    useLastDayOfMonth: budget.useLastDayOfMonth,
    periodAnchorMs: isDefined(budget.periodAnchorDate) ? budget.periodAnchorDate.getTime() : null,
    limitSource: budget.limitSource,
    isAutoTuneEnabled: budget.isAutoTuneEnabled,
    overallLimit: convertFromMicroUnits(budget.overallLimit),
    otherLimit: convertFromMicroUnits(budget.otherLimit),
    otherRolloverMode: budget.otherRolloverMode,
    categoryLimits: categoryLimits.map(limit => ({
        categoryId: limit.categoryId,
        limitAmount: convertFromMicroUnits(limit.limitAmount),
        rolloverMode: limit.rolloverMode
    })),
    instrumentId: budget.instrumentId
});

const buildDefaultBudgetFormValues = (name: string, instrumentId: number): BudgetFormValues => ({
    name,
    period: BudgetPeriodEnum.MONTHLY,
    periodStartDay: DEFAULT_PERIOD_START_DAY,
    useLastDayOfMonth: false,
    periodAnchorMs: null,
    limitSource: BudgetLimitSourceEnum.FIXED,
    isAutoTuneEnabled: true,
    overallLimit: 0,
    otherLimit: 0,
    otherRolloverMode: BudgetRolloverModeEnum.NONE,
    categoryLimits: [],
    instrumentId
});

const buildTemplateBudgetFormValues = (
    name: string,
    defaultInstrumentId: number,
    templateDraft: BudgetTemplateDraftInterface
): BudgetFormValues => {
    const allocation = budgetComputeAllocation({
        overallLimit: templateDraft.overallLimit,
        otherLimit: 0,
        categoryLimits: templateDraft.categoryLimits
    });
    const otherLimit = Math.max(0, allocation.remaining);

    return {
        name,
        period: BudgetPeriodEnum.MONTHLY,
        periodStartDay: DEFAULT_PERIOD_START_DAY,
        useLastDayOfMonth: false,
        periodAnchorMs: null,
        limitSource: BudgetLimitSourceEnum.FIXED,
        isAutoTuneEnabled: true,
        overallLimit: templateDraft.overallLimit,
        otherLimit,
        otherRolloverMode: BudgetRolloverModeEnum.NONE,
        categoryLimits: templateDraft.categoryLimits.map(limit => ({ ...limit, rolloverMode: BudgetRolloverModeEnum.NONE })),
        instrumentId: defaultInstrumentId
    };
};

const areBudgetCategoryLimitsEqual = (left: BudgetFormValues['categoryLimits'], right: BudgetFormValues['categoryLimits']): boolean => {
    if (left.length !== right.length) {
        return false;
    }

    return left.every((leftLimit, index) => {
        const rightLimit = right[index];

        return (
            isDefined(rightLimit) &&
            leftLimit.categoryId === rightLimit.categoryId &&
            leftLimit.limitAmount === rightLimit.limitAmount &&
            leftLimit.rolloverMode === rightLimit.rolloverMode
        );
    });
};

const areBudgetFormValuesEqual = (left: BudgetFormValues, right: BudgetFormValues): boolean =>
    left.name === right.name &&
    left.period === right.period &&
    left.periodAnchorMs === right.periodAnchorMs &&
    left.limitSource === right.limitSource &&
    left.isAutoTuneEnabled === right.isAutoTuneEnabled &&
    left.periodStartDay === right.periodStartDay &&
    left.useLastDayOfMonth === right.useLastDayOfMonth &&
    left.overallLimit === right.overallLimit &&
    left.otherLimit === right.otherLimit &&
    left.otherRolloverMode === right.otherRolloverMode &&
    left.instrumentId === right.instrumentId &&
    areBudgetCategoryLimitsEqual(left.categoryLimits, right.categoryLimits);

// eslint-disable-next-line max-lines-per-function -- Form orchestration hook owns edit/template seeding, delete confirmation, and submit lifecycle
export const useBudgetForm = ({ defaultInstrumentId, editingId, templateKind = null }: UseBudgetFormOptionsInterface) => {
    const { t } = useLingui();
    const { run } = useSingleFlight();
    const isEditing = isPositiveNumber(editingId);
    const hasAsyncTemplate = isDefined(templateKind) && templateKind !== BudgetTemplateKindEnum.EMPTY;
    const { budget, isLoading: isBudgetLoading } = useGetActiveBudgetQuery();
    const { categoryLimits: loadedCategoryLimits, isLoading: isCategoryLimitsLoading } = useGetBudgetCategoryLimitsQuery(
        isEditing && isDefined(budget) ? budget.id : null
    );
    const { draft: templateDraft, isReady: isTemplateReady } = useBudgetTemplateDraft(isEditing ? null : templateKind);

    const resolveFormValues = (): BudgetFormValues => {
        if (isEditing && isDefined(budget) && !isCategoryLimitsLoading) {
            return buildBudgetFormValues(budget, loadedCategoryLimits);
        }

        if (!isEditing && hasAsyncTemplate && isTemplateReady) {
            return buildTemplateBudgetFormValues(t`Monthly Budget`, defaultInstrumentId, templateDraft);
        }

        return buildDefaultBudgetFormValues(t`Monthly Budget`, defaultInstrumentId);
    };

    const formValues = resolveFormValues();

    const form = useForm<BudgetFormValues>({
        mode: 'onChange',
        resolver: standardSchemaResolver(Schema.toStandardSchemaV1(BudgetFormSchema)),
        defaultValues: buildDefaultBudgetFormValues(t`Monthly Budget`, defaultInstrumentId),
        values: formValues,
        resetOptions: {
            keepDirtyValues: true,
            keepErrors: true
        }
    });
    const isFormSyncing =
        (isEditing || hasAsyncTemplate) && !form.formState.isDirty && !areBudgetFormValuesEqual(form.getValues(), formValues);

    const handleDelete = () =>
        run(
            Effect.gen(function* () {
                const confirmed = yield* confirmAlert({
                    title: t`Delete budget?`,
                    message: t`This will remove your monthly budget. You can create a new one anytime.`,
                    confirmText: t`Delete`,
                    cancelText: t`Cancel`,
                    isDestructive: true
                });

                if (!confirmed || !isDefined(budget)) {
                    return;
                }

                const budgetService = yield* BudgetService;

                yield* budgetService.deleteBudget(budget.id);
                goBackOrReplace('/');
            }).pipe(toastOnFailure(t`Could not delete budget`))
        );

    const handleCancel = () => {
        if (isEditing && isDefined(budget)) {
            form.reset(buildBudgetFormValues(budget, loadedCategoryLimits));
        }
        const fallbackRoute = isEditing ? EDITING_FALLBACK_ROUTE : DEFAULT_FALLBACK_ROUTE;
        goBackOrReplace(fallbackRoute);
    };

    const handleSubmit = () => {
        if (isPositiveNumber(defaultInstrumentId) && !isPositiveNumber(form.getValues('instrumentId'))) {
            form.setValue('instrumentId', defaultInstrumentId, { shouldDirty: false, shouldTouch: false, shouldValidate: true });
        }

        void form.handleSubmit(values =>
            run(
                Effect.gen(function* () {
                    const basePayload = buildBudgetPayload(values);
                    const budgetService = yield* BudgetService;

                    if (isPositiveNumber(editingId)) {
                        yield* budgetService.updateBudget(editingId, basePayload);
                    } else {
                        yield* budgetService.createBudget(basePayload);
                    }

                    const fallbackRoute = isEditing ? EDITING_FALLBACK_ROUTE : DEFAULT_FALLBACK_ROUTE;
                    goBackOrReplace(fallbackRoute);
                }).pipe(toastOnFailure(isEditing ? t`Could not save budget` : t`Could not create budget`))
            )
        )();
    };

    return {
        form,
        handleCancel,
        handleSubmit,
        handleDelete,
        isEditing,
        budget,
        isLoading:
            (isEditing && (isBudgetLoading || isCategoryLimitsLoading || !isDefined(budget))) ||
            (!isEditing && hasAsyncTemplate && !isTemplateReady) ||
            isFormSyncing
    };
};
