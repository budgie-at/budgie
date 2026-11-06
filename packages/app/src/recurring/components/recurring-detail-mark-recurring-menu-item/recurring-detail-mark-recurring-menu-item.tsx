import { UserIconNameEnum } from '@budgie/contracts';
import { RecurringService } from '@budgie/recurring';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { RecurringDetailSelector } from '../recurring-detail-content/recurring-detail.selector';

interface Props {
    readonly seriesId: number;
}

export const RecurringDetailMarkRecurringMenuItem = ({ seriesId }: Props) => {
    const { t } = useLingui();

    const handlePress = () => {
        appRuntime.runFork(
            logAndContinue(
                Effect.flatMap(RecurringService, recurringService => recurringService.confirm(seriesId)).pipe(
                    toastOnFailure(t`Could not update recurring payment.`)
                )
            )
        );
    };

    return (
        <ActionsMenuItem
            icon={UserIconNameEnum.Repeat}
            label={t`Mark as recurring`}
            onPress={handlePress}
            testID={RecurringDetailSelector.MarkRecurringButton}
        />
    );
};
