import { AccountArchiveService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import Toast from 'react-native-toast-message';

import { appRuntime } from '../../@generic/runtime/app.runtime';

export const useDeleteAccount = () => {
    const { t } = useLingui();

    return (id: number) =>
        appRuntime.runPromise(
            Effect.flatMap(AccountArchiveService, accountArchiveService => accountArchiveService.deleteById(id)).pipe(
                Effect.tapCause(() =>
                    Effect.sync(
                        () =>
                            void Toast.show({
                                type: 'error',
                                text1: t`Could not delete account.`,
                                text2: t`Something went wrong. Please try again later.`
                            })
                    )
                )
            )
        );
};
