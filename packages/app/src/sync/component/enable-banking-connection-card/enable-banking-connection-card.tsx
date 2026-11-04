import { SyncErrorCodeEnum, UserIconNameEnum } from '@budgie/contracts';
import { EnableBankingTokenSchema } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { useBankIntegration } from '../../context/bank-integration.context';
import { useBankIntegrationSyncsQuery } from '../../query/use-bank-integration-syncs.query';
import { EnableBankingChooseKeyRow } from '../enable-banking-choose-key-row/enable-banking-choose-key-row';
import { EnableBankingDisconnectRow } from '../enable-banking-disconnect-row/enable-banking-disconnect-row';
import { EnableBankingReauthorizeRow } from '../enable-banking-reauthorize-row/enable-banking-reauthorize-row';

import { EnableBankingConnectionCardSelector } from './enable-banking-connection-card.selector';

const decodeToken = Schema.decodeUnknownOption(Schema.fromJsonString(EnableBankingTokenSchema));
const REAUTHORIZE_LEAD_MS = 7 * 24 * 60 * 60 * 1000;

export const EnableBankingConnectionCard = () => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const syncs = useBankIntegrationSyncsQuery(integration.id);
    const { formatDayAndMonthAndYear } = useFormatDate();
    const [nowMs] = useState(Date.now);

    const token = Option.getOrNull(decodeToken(integration.token));
    const validUntil = isDefined(token) ? new Date(token.validUntil) : null;
    const isConsentEnding = isDefined(validUntil) && validUntil.getTime() - nowMs < REAUTHORIZE_LEAD_MS;
    const hasErrorCode = (errorCode: SyncErrorCodeEnum) => syncs.some(sync => sync.lastErrorCode === errorCode);
    const isNotLinked = hasErrorCode(SyncErrorCodeEnum.ACCOUNT_NOT_LINKED);
    const needsReauthorization = isConsentEnding || isNotLinked || hasErrorCode(SyncErrorCodeEnum.CONSENT_EXPIRED);
    const needsKey = isDefined(token) && hasErrorCode(SyncErrorCodeEnum.UNAUTHORIZED);
    const validUntilLabel = isDefined(validUntil) ? formatDayAndMonthAndYear(validUntil) : '';

    return (
        <GroupedListSection title={t`Connection`} footer={t`Requests go from this phone to Enable Banking and your bank. Budgie has no server.`}>
            <SettingsRow
                icon={UserIconNameEnum.CalendarClock}
                variant="primary"
                title={t`Consent valid until`}
                subtitle={validUntilLabel}
                testID={EnableBankingConnectionCardSelector.ValidUntil}
            />
            {isNotLinked ? (
                <SettingsRow
                    icon={UserIconNameEnum.Unlink}
                    variant="warning"
                    title={t`Account not linked`}
                    subtitle={t`Link every account you sync to your application in Enable Banking, then authorize again.`}
                    testID={EnableBankingConnectionCardSelector.NotLinked}
                />
            ) : null}
            {needsReauthorization ? <EnableBankingReauthorizeRow /> : null}
            {needsKey ? <EnableBankingChooseKeyRow applicationId={token.applicationId} /> : null}
            <EnableBankingDisconnectRow />
        </GroupedListSection>
    );
};
