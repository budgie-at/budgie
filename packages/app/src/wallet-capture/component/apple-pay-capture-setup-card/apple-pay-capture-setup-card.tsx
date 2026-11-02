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
            description: t`In Shortcuts, add a personal automation with the Transaction trigger, select your cards and choose Run Immediately.`
        },
        {
            title: t`Add the Budgie action`,
            description: t`Add Capture contactless payment and set Amount, Merchant and Card from the Shortcut Input.`
        },
        {
            title: t`Save it`,
            description: t`Budgie picks the account from the card name, so one automation covers all your cards.`
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
