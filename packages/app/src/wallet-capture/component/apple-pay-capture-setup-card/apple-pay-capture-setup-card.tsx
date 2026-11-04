import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { ApplePayCaptureSetupRow } from '../apple-pay-capture-setup-row/apple-pay-capture-setup-row';

interface Props {
    readonly testID?: string;
}

export const ApplePayCaptureSetupCard = ({ testID }: Props) => {
    const { t } = useLingui();
    const setupSteps = [
        {
            title: t`Create an automation`,
            description: t`In Shortcuts, add a Transaction automation. Pick cards and Run Immediately.`
        },
        {
            title: t`Add the Budgie action`,
            description: t`Add Capture contactless payment. Set Amount, Merchant and Card to Shortcut Input.`
        },
        {
            title: t`Save it`,
            description: t`Save the automation. Budgie matches card names to accounts for all your cards.`
        }
    ];

    return (
        <View testID={testID}>
            {setupSteps.map((step, index) => (
                <ApplePayCaptureSetupRow key={step.title} title={step.title} description={step.description} index={index} />
            ))}
        </View>
    );
};
