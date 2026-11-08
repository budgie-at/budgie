import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';

import { TransactionKeypadContext } from '../../context/transaction-keypad.context';
import { TransactionKeypadButton } from '../transaction-keypad-button/transaction-keypad-button';
import { TransactionKeypadSelector } from '../transaction-keypad/transaction-keypad.selector';

export const TransactionKeypadDismissButton = () => {
    const { dismiss } = use(TransactionKeypadContext);
    const { t } = useLingui();

    return (
        <TransactionKeypadButton
            icon={UserIconNameEnum.ChevronDown}
            accessibilityLabel={t`Hide keypad`}
            onPress={dismiss}
            testID={TransactionKeypadSelector.Dismiss}
        />
    );
};
