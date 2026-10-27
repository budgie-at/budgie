import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Linking } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { runWithErrorToast } from '../../utils/run-with-error-toast.util';

interface Props {
    readonly testID: string;
}

export const ApplePayCaptureInstructionsButton = ({ testID }: Props) => {
    const { t } = useLingui();
    const language = useSetting('language');

    const handlePressInstructionsGuide = () =>
        void runWithErrorToast(
            Effect.promise(() => Linking.openURL(`https://budgie.at/${language}/blog/apple-pay-shortcuts-instructions`)).pipe(
                Effect.asVoid
            ),
            t`Could not open instructions`
        );

    return (
        <Button
            testID={testID}
            onPress={handlePressInstructionsGuide}
            content={t`View step-by-step instructions`}
            leftIcon={UserIconNameEnum.ExternalLink}
            variant="ghost"
        />
    );
};
