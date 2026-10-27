import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { ApplePayCaptureTroubleshootingRow } from '../apple-pay-capture-troubleshooting-row/apple-pay-capture-troubleshooting-row';

export const ApplePayCaptureTroubleshootingCard = () => {
    const { t } = useLingui();

    return (
        <Card size="md" className="gap-y-xl">
            <ApplePayCaptureTroubleshootingRow
                icon={UserIconNameEnum.Search}
                title={t`Budgie action is missing`}
                description={t`Open Budgie once after updating, then return to Shortcuts and search for Budgie again.`}
            />
            <View className="h-px bg-secondary-corner" />
            <ApplePayCaptureTroubleshootingRow
                icon={UserIconNameEnum.CircleAlert}
                title={t`Amount or merchant is empty`}
                description={t`Some issuers do not provide every Wallet trigger field. Edit the automation and check the variable bindings.`}
            />
            <View className="h-px bg-secondary-corner" />
            <ApplePayCaptureTroubleshootingRow
                icon={UserIconNameEnum.Wallet}
                title={t`Wrong or missing account`}
                description={t`Budgie picks the account from the card name, then your default account. Name the account like the card, or set the optional Account field in the action to pin one.`}
            />
        </Card>
    );
};
