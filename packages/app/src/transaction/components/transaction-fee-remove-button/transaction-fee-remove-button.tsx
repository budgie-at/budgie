import { UserIconNameEnum, logAndContinue } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import * as Effect from 'effect/Effect';

import { Button } from '../../../@generic/component/button/button';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { TransactionFeeModalContentSelector } from '../transaction-fee-modal-content/transaction-fee-modal-content.selector';

interface Props {
    readonly onRemove: () => void;
}

export const TransactionFeeRemoveButton = ({ onRemove }: Props) => {
    const handleRemove = () =>
        appRuntime.runFork(
            logAndContinue(
                Effect.gen(function* () {
                    const confirmed = yield* confirmAlert({
                        title: t`Remove fee?`,
                        message: t`This will remove the fee entry from this transaction.`,
                        confirmText: t`Remove fee`,
                        cancelText: t`Cancel`,
                        isDestructive: true
                    });

                    if (confirmed) {
                        onRemove();
                    }
                })
            )
        );

    return (
        <Button
            leftIcon={UserIconNameEnum.X}
            variant="destructive"
            size="md"
            className="aspect-square"
            onPress={handleRemove}
            testID={TransactionFeeModalContentSelector.RemoveButton}
        />
    );
};
