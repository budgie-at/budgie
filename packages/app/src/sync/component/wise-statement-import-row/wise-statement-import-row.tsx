import { ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { isInitialSyncIncomplete, WISE_ASPSP_NAME, WiseStatementImportService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';

import { isNotEmptyArray } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { decodeEnableBankingToken } from '../../constant/decode-enable-banking-token.constant';
import { useBankIntegration } from '../../context/bank-integration.context';
import { useQuickImport } from '../../hook/use-quick-import.hook';
import { useBankIntegrationSyncsQuery } from '../../query/use-bank-integration-syncs.query';

export const WiseStatementImportRow = () => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const syncs = useBankIntegrationSyncsQuery(integration.id);
    const { isLoading, handleQuickImport } = useQuickImport({
        mimeType: 'text/csv',
        source: ExternalSourceEnum.WISE,
        importHandler: uri => Effect.flatMap(WiseStatementImportService, service => service.importForIntegration(uri, integration.id))
    });

    const aspspName = Option.getOrNull(decodeEnableBankingToken(integration.token))?.aspspName;
    const isWiseConnection = aspspName === WISE_ASPSP_NAME;

    if (!isWiseConnection) {
        return null;
    }

    const isHistoryReady = isNotEmptyArray(syncs) && !syncs.some(isInitialSyncIncomplete);
    const subtitle = isHistoryReady ? t`Wise CSV export, one file per balance` : t`Available after the first sync finishes`;

    return (
        <GroupedListSection title={t`History`}>
            <LoadingContent isLoading={isLoading}>
                <SettingsRow
                    icon={UserIconNameEnum.FileSpreadsheet}
                    variant="primary"
                    title={t`Import older history`}
                    subtitle={subtitle}
                    testID={BankIntegrationSelector.ImportOlderHistoryButton}
                    {...(isHistoryReady && { onPress: handleQuickImport })}
                />
            </LoadingContent>
        </GroupedListSection>
    );
};
