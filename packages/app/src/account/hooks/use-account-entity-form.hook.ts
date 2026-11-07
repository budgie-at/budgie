import { HouseholdShareService } from '@budgie/cloud-sync';
import { AccountEntityInterface } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import * as Effect from 'effect/Effect';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { useShowError } from '../../@generic/hook/use-show-error.hook';
import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { householdAccountShareDraftAtom } from '../constant/household-account-share-draft-atom.constant';

import type { AppServices } from '../../@generic/runtime/app.runtime';
import type * as Cause from 'effect/Cause';
import type { FieldErrors, FieldValues, Resolver, UseFormHandleSubmit, UseFormReturn } from 'react-hook-form';

export const useAccountEntityForm = <T extends FieldValues>(
    resolver: Resolver<T>,
    values: T,
    onSubmit: (values: T) => Effect.Effect<AccountEntityInterface, Cause.YieldableError, AppServices>
): Omit<UseFormReturn<T>, 'handleSubmit'> & {
    readonly isSubmitting: boolean;
    readonly handleSubmit: ReturnType<UseFormHandleSubmit<T>>;
} => {
    const showError = useShowError();
    const { run } = useSingleFlight();
    const form = useForm<T>({
        resolver,
        mode: 'onSubmit',
        values,
        resetOptions: { keepDirtyValues: true }
    });
    const { isSubmitting } = form.formState;

    const handleSubmit = (submittedValues: T) =>
        run(
            onSubmit(submittedValues).pipe(
                Effect.tap(account => {
                    const isShared = appAtomRegistry.get(householdAccountShareDraftAtom(account.id));

                    return isDefined(isShared)
                        ? Effect.flatMap(HouseholdShareService, householdShareService =>
                              isShared ? householdShareService.shareAccount(account.id) : householdShareService.unshareAccount(account.id)
                          )
                        : Effect.void;
                }),
                Effect.tap(() => Effect.sync(() => void router.replace('/'))),
                toastOnFailure(t`Something went wrong`)
            )
        );

    const handleInvalid = (errors: FieldErrors<T>) => {
        const message = Object.values(errors).find(error => isNotEmptyString(error?.message))?.message;

        showError(new Error(isNotEmptyString(message) ? message : t`Please check the account details`));
    };

    return {
        ...form,
        isSubmitting,
        handleSubmit: form.handleSubmit(handleSubmit, handleInvalid)
    };
};
