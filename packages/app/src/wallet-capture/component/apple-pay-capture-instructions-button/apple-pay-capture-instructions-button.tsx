import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Linking } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { Icon } from '../../../@generic/component/icon/icon';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useSetting } from '../../../settings/hook/use-setting.hook';

interface Props {
    readonly testID: string;
}

export const ApplePayCaptureInstructionsButton = ({ testID }: Props) => {
    const { t } = useLingui();
    const language = useSetting('language');

    const handlePressInstructionsGuide = () =>
        void appRuntime.runFork(
            logAndContinue(
                Effect.promise(() => Linking.openURL(`https://budgie.at/${language}/blog/apple-pay-shortcuts-instructions`)).pipe(
                    toastOnFailure(t`Could not open instructions`)
                )
            )
        );

    return (
        <GroupedListRow
            testID={testID}
            onPress={handlePressInstructionsGuide}
            title={t`Step-by-step instructions`}
            right={<Icon icon={UserIconNameEnum.ArrowUpRight} size={16} className="text-secondary-foreground" />}
        />
    );
};
