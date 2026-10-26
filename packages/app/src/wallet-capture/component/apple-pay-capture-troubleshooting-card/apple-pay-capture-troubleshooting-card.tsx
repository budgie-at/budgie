import { useLingui } from '@lingui/react/macro';

import { Card } from '../../../@generic/component/card/card';
import { ApplePayCaptureTroubleshootingRow } from '../apple-pay-capture-troubleshooting-row/apple-pay-capture-troubleshooting-row';

export const ApplePayCaptureTroubleshootingCard = () => {
    const { t } = useLingui();
    const troubleshootingRows = [
        {
            title: t`Budgie action is missing`,
            description: t`Open Budgie once after updating, then return to Shortcuts and search for Budgie again.`
        },
        {
            title: t`Amount or merchant is empty`,
            description: t`Some issuers do not provide every Wallet trigger field. Edit the automation and check the variable bindings.`
        },
        {
            title: t`Wrong or missing account`,
            description: t`Budgie picks the account from the card name, then your default account. Name the account like the card, or set the optional Account field in the action to pin one.`
        }
    ];

    return (
        <Card className="gap-y-lg">
            {troubleshootingRows.map(row => (
                <ApplePayCaptureTroubleshootingRow key={row.title} title={row.title} description={row.description} />
            ))}
        </Card>
    );
};
