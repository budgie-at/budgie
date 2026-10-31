import { InstallmentPlanService } from '@budgie/ledger';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useFormContext, useFormState } from 'react-hook-form';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Button } from '../../../@generic/component/button/button';
import { ENTRANCE_DURATION, ENTRANCE_REDUCED_DURATION } from '../../../@generic/constant/entrance-motion.constant';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';

import type { ConvertToInstallmentFormValues } from '../../constant/convert-to-installment-form-schema.constant';
import type { ConvertToInstallmentModalParamsInterface } from '../../interface/convert-to-installment-modal-params.interface';
import type { InstallmentSplitInterface } from '../../interface/installment-split.interface';

interface Props {
    readonly params: Pick<ConvertToInstallmentModalParamsInterface, 'transactionId'>;
    readonly split: Pick<InstallmentSplitInterface, 'installmentCount' | 'planTotal' | 'isSplittable'>;
    readonly recoveryNote: string;
    readonly onResolve: (accountId: number) => void;
}

export const ConvertToInstallmentCreateButton = ({ params, split, recoveryNote, onResolve }: Props) => {
    const { t } = useLingui();
    const { control, handleSubmit } = useFormContext<ConvertToInstallmentFormValues>();
    const { isValid, isSubmitting } = useFormState({ control });
    const { installmentCount, planTotal, isSplittable } = split;

    const handleCreate = () =>
        void handleSubmit(values =>
            appRuntime.runPromise(
                logAndContinue(
                    Effect.flatMap(InstallmentPlanService, installmentPlanService =>
                        installmentPlanService.convertExpense({
                            transactionId: params.transactionId,
                            installmentCount: values.installmentCount,
                            totalAmount: planTotal,
                            title: values.title
                        })
                    ).pipe(
                        Effect.tap(({ accountId }) => Effect.sync(() => void onResolve(accountId))),
                        toastOnFailure(t`Could not create plan`, t`Please try again`)
                    )
                )
            )
        )();

    const isCreateDisabled = !isValid || !isSplittable;
    const createVariant = isCreateDisabled ? 'secondary' : 'cta';
    const createLabel = t({ message: plural(installmentCount, { one: 'Split into # payment', other: 'Split into # payments' }) });

    return (
        <Animated.View
            className="px-3xl pb-xl"
            entering={FadeIn.duration(ENTRANCE_DURATION)}
            exiting={FadeOut.duration(ENTRANCE_REDUCED_DURATION)}
        >
            <Button
                content={createLabel}
                variant={createVariant}
                size="lg"
                {...(isCreateDisabled && { className: 'border-transparent bg-surface-fill opacity-100' })}
                isLoading={isSubmitting}
                disabled={isCreateDisabled}
                onPress={handleCreate}
                {...(!isSplittable && { accessibilityHint: recoveryNote })}
                testID={ConvertToInstallmentModalSelector.CreateButton}
            />
        </Animated.View>
    );
};
