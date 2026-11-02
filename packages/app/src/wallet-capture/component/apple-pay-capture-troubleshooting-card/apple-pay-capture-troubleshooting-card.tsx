import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { ApplePayCaptureTroubleshootingRow } from '../apple-pay-capture-troubleshooting-row/apple-pay-capture-troubleshooting-row';

export const ApplePayCaptureTroubleshootingCard = () => {
    const { t } = useLingui();

    return (
        <View>
            <ApplePayCaptureTroubleshootingRow
                icon={UserIconNameEnum.Search}
                title={t`Budgie action is missing`}
                description={t`Open Budgie once after updating, then return to Shortcuts and search for Budgie again.`}
            />
            <ApplePayCaptureTroubleshootingRow
                icon={UserIconNameEnum.CircleAlert}
                title={t`Amount or merchant is empty`}
                description={t`Set Amount and Merchant to Shortcut Input.`}
            />
            <ApplePayCaptureTroubleshootingRow
                icon={UserIconNameEnum.Wallet}
                title={t`Wrong or missing account`}
                description={t`Budgie matches the card name, then uses your default account. Rename the account to match, or choose Account in the Shortcuts action.`}
            />
        </View>
    );
};
