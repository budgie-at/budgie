import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import Toast from 'react-native-toast-message';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { DatabaseExportService } from '../service/database-export.service';

export const useBackupActions = () => {
    const { t } = useLingui();
    const { isLoading, run } = useSingleFlight();

    const handleBackup = () =>
        void run(
            Effect.gen(function* () {
                const databaseExportService = yield* DatabaseExportService;
                const saved = yield* databaseExportService.saveBackup();

                if (saved) {
                    yield* Effect.sync(() => {
                        Toast.show({
                            type: 'success',
                            text1: t`Backup saved`,
                            text2: t`Saved to your chosen folder.`
                        });
                    });
                }
            }).pipe(toastOnFailure(t`Could not create a backup`))
        );
    const handleShare = () =>
        void run(
            Effect.flatMap(DatabaseExportService, service => service.exportAndShare()).pipe(toastOnFailure(t`Could not create a backup`))
        );

    return { isLoading, handleBackup, handleShare };
};
