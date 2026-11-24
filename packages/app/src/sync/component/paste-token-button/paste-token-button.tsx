import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { getStringAsync } from 'expo-clipboard';
import Toast from 'react-native-toast-message';

import { isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { toNativeCallError } from '../../../@generic/utils/to-native-call-error.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { isLikelyMonoToken } from '../../type-guard/is-likely-mono-token.type-guard';

interface Props {
    readonly onPaste: (token: string) => void;
    readonly testID?: string;
    readonly className?: string;
}

export const PasteTokenButton = ({ onPaste, testID, className }: Props) => {
    const { t } = useLingui();

    const { isLoading, run } = useSingleFlight();

    const handlePress = () =>
        run(
            Effect.gen(function* () {
                const clipboardContent = yield* Effect.tryPromise({ try: () => getStringAsync(), catch: toNativeCallError });

                if (!isNotEmptyString(clipboardContent)) {
                    Toast.show({ type: 'info', text1: t`Clipboard is empty` });

                    return;
                }

                const trimmedToken = clipboardContent.trim();

                if (!isLikelyMonoToken(trimmedToken)) {
                    Toast.show({ type: 'error', text1: t`Clipboard doesn't contain a valid Monobank token` });

                    return;
                }

                onPaste(trimmedToken);
            }).pipe(toastOnFailure(t`Could not read clipboard`))
        );

    return (
        <Button
            className={cn('min-h-[44px] min-w-[44px]', className)}
            leftIcon={UserIconNameEnum.ClipboardPaste}
            size="sm"
            variant="secondary"
            isLoading={isLoading}
            onPress={handlePress}
            testID={testID}
        />
    );
};
