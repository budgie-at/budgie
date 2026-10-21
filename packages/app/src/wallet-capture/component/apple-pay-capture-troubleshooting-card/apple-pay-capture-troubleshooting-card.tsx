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
            title: t`Account is archived`,
            description: t`Restore the account or choose another active account in the automation before importing the capture.`
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
