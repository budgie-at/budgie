import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { CsvPageSelectors } from '../../../@e2e/selectors/csv-page.selector';
import { isE2ECsvModeEnabled } from '../../../@e2e/util/is-e2e-csv-mode-enabled.util';
import { appE2ECsvService } from '../../../@generic/service/app-e2e-csv.service';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';

export const ImportCsv = () => {
    const { t } = useLingui();
    const [isLoading, setIsLoading] = useState(false);

    const handleSelectAndNavigate = async () => {
        setIsLoading(true);
        try {
            if (isE2ECsvModeEnabled()) {
                router.push({ pathname: '/settings/import', params: { fileUri: appE2ECsvService.getImportFixtureUri() } });

                return;
            }

            const result = await DocumentPicker.getDocumentAsync({ type: 'text/csv', copyToCacheDirectory: true });
            const { uri } = result.assets?.at(0) ?? {};

            if (result.canceled || !isNotEmptyString(uri)) {
                setIsLoading(false);

                return;
            }

            router.push({ pathname: '/settings/import', params: { fileUri: uri } });
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Error`, text2: getErrorMessage(error) });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SettingsCard
            title={t`Import CSV`}
            description={t`Import transactions from a CSV file`}
            onPress={handleSelectAndNavigate}
            icon={UserIconNameEnum.Upload}
            variant="warning"
            isLoading={isLoading}
            testID={CsvPageSelectors.ImportCard}
        />
    );
};
