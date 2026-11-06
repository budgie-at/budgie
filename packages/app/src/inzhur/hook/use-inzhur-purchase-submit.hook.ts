import { InzhurManualPurchaseService, InzhurPurchaseExceedsTopUpError } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useFormContext } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { useHryvniaInstrumentQuery } from '../query/use-hryvnia-instrument.query';
import { buildInzhurPurchaseDefaults } from '../utils/build-inzhur-purchase-defaults.util';

import type { InzhurPurchaseFormValues } from '../constant/inzhur-purchase-form-schema.constant';

export const useInzhurPurchaseSubmit = (topUpTransactionId: number) => {
    const { t } = useLingui();
    const { isLoading, run } = useSingleFlight();
    const { handleSubmit, reset } = useFormContext<InzhurPurchaseFormValues>();

    const formatAmount = useProtectedAmountLabel();
    const symbol = useHryvniaInstrumentQuery()?.symbol ?? '₴';
    const title = t`Could not save the purchase`;
    const toast = (message: string) => Effect.sync(() => void showErrorToast(title, message));
    const purchaseFailureToasts = {
        InzhurNotSetUpError: () => toast(t`Inzhur is not set up yet`),
        InzhurPurchaseInvalidError: () => toast(t`Enter a whole number of certificates and a positive amount`),
        InzhurTopUpNotFoundError: () => toast(t`This top-up is no longer waiting for a purchase`),
        InzhurPurchaseBeforeTopUpError: () => toast(t`A purchase cannot be dated before its top-up`),
        InzhurPurchaseExceedsTopUpError: ({ remainingAmount }: InzhurPurchaseExceedsTopUpError) => {
            const remainingLabel = formatAmount(remainingAmount, symbol);

            return toast(t`Only ${remainingLabel} of this top-up is left to spend`);
        }
    };

    const recordPurchase = (values: InzhurPurchaseFormValues) =>
        Effect.flatMap(InzhurManualPurchaseService, inzhurManualPurchaseService =>
            inzhurManualPurchaseService.recordPurchase({ topUpTransactionId, ...values })
        );

    const handleSave = handleSubmit(values =>
        run(
            recordPurchase(values).pipe(
                Effect.tap(() => Effect.sync(() => void goBackOrReplace('/'))),
                Effect.catchTags(purchaseFailureToasts),
                toastOnFailure(title)
            )
        )
    );

    const handleSaveAndAddAnother = handleSubmit(values =>
        run(
            recordPurchase(values).pipe(
                Effect.andThen(
                    Effect.flatMap(InzhurManualPurchaseService, inzhurManualPurchaseService =>
                        inzhurManualPurchaseService.findTopUp(topUpTransactionId)
                    )
                ),
                Effect.tap(nextTopUp =>
                    Effect.sync(() => {
                        if (isDefined(nextTopUp)) {
                            reset(buildInzhurPurchaseDefaults(nextTopUp, values.fundName));
                        }
                    })
                ),
                Effect.catchTags(purchaseFailureToasts),
                toastOnFailure(title)
            )
        )
    );

    return { isLoading, handleSave, handleSaveAndAddAnother };
};
