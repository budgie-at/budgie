import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Linking } from 'react-native';

import { TransactionInfoRow } from '../../../transaction/components/transaction-info-row/transaction-info-row';
import { RecurringDetailSelector } from '../recurring-detail-content/recurring-detail.selector';

const handleOpenSettings = () => void Linking.openSettings();

export const RecurringReminderDeniedRow = () => {
    const { t } = useLingui();

    return (
        <TransactionInfoRow
            icon={UserIconNameEnum.BellOff}
            value={t`Off`}
            description={t`Notifications are off · Open Settings`}
            testID={RecurringDetailSelector.ReminderSettingsButton}
            onPress={handleOpenSettings}
        />
    );
};
