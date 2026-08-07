import { useLingui } from '@lingui/react/macro';

import { Card } from '../../../@generic/component/card/card';
import { ApplePayCaptureSetupRow } from '../apple-pay-capture-setup-row/apple-pay-capture-setup-row';

export const ApplePayCaptureSetupCard = () => {
    const { t } = useLingui();
    const setupSteps = [
        t`Open Shortcuts and create a personal automation.`,
        t`Select the Wallet or Transaction trigger.`,
        t`Select one Wallet card.`,
        t`Select Run Immediately.`,
        t`Add Budgie's Capture Apple Pay transaction action.`,
        t`Bind Amount to Shortcut Input → Amount.`,
        t`Bind Merchant to Shortcut Input → Merchant.`,
        t`Bind the optional Card field to the Wallet card/pass value.`,
        t`Select a fixed Budgie account in the action's Account picker.`,
        t`Save the automation.`
    ];

    return (
        <Card className="gap-y-lg">
            {setupSteps.map((content, index) => (
                <ApplePayCaptureSetupRow key={content} content={content} index={index} />
            ))}
        </Card>
    );
};
