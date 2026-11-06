import { InzhurManualPurchaseService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useFormContext } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { buildInzhurPurchaseDefaults } from '../utils/build-inzhur-purchase-defaults.util';

import type { InzhurPurchaseFormValues } from '../constant/inzhur-purchase-form-schema.constant';

export const useInzhurPurchaseSubmit = (topUpTransactionId: number) => {
    const { t } = useLingui();
    const { isLoading, run } = useSingleFlight();
    const { handleSubmit, reset } = useFormContext<InzhurPurchaseFormValues>();

    const recordPurchase = (values: InzhurPurchaseFormValues) =>
        Effect.flatMap(InzhurManualPurchaseService, inzhurManualPurchaseService =>
            inzhurManualPurchaseService.recordPurchase({ topUpTransactionId, ...values })
        );

    const handleSave = handleSubmit(values =>
        run(
            recordPurchase(values).pipe(
                Effect.tap(() => Effect.sync(() => void goBackOrReplace('/'))),
                toastOnFailure(t`Could not save the purchase`)
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
                            reset(buildInzhurPurchaseDefaults(nextTopUp));
                        }
                    })
                ),
                toastOnFailure(t`Could not save the purchase`)
            )
        )
    );

    return { isLoading, handleSave, handleSaveAndAddAnother };
};
