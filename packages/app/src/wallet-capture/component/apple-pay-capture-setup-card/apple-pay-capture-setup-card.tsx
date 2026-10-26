import { useLingui } from '@lingui/react/macro';

import { Card } from '../../../@generic/component/card/card';
import { ApplePayCaptureSetupRow } from '../apple-pay-capture-setup-row/apple-pay-capture-setup-row';

interface Props {
    readonly testID?: string;
}

export const ApplePayCaptureSetupCard = ({ testID }: Props) => {
    const { t } = useLingui();
    const setupSteps = [
        t`Create a personal automation in Shortcuts with the Transaction trigger, select your cards and choose Run Immediately.`,
        t`Add Budgie's Capture Apple Pay transaction action and set Amount, Merchant and Card from the Shortcut Input.`,
        t`Save the automation.`
    ];

    return (
        <Card testID={testID} className="gap-y-lg">
            {setupSteps.map((content, index) => (
                <ApplePayCaptureSetupRow key={content} content={content} index={index} />
            ))}
        </Card>
    );
};
