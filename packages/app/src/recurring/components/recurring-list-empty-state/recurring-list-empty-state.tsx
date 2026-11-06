import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { RecurringPaneSelector } from '../recurring-pane/recurring-pane.selector';

export const RecurringListEmptyState = () => {
    const { t } = useLingui();

    return (
        <EmptyState
            icon={UserIconNameEnum.Repeat}
            title={t`No recurring payments yet`}
            description={t`They are detected from your transactions, or add one with +.`}
            testID={RecurringPaneSelector.EmptyState}
        />
    );
};
