import { SyncErrorCodeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Option from 'effect/Option';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { decodeEnableBankingToken } from '../../constant/decode-enable-banking-token.constant';
import { useBankIntegration } from '../../context/bank-integration.context';
import { useBankIntegrationSyncsQuery } from '../../query/use-bank-integration-syncs.query';
import { EnableBankingChooseKeyRow } from '../enable-banking-choose-key-row/enable-banking-choose-key-row';
import { EnableBankingConsentRow } from '../enable-banking-consent-row/enable-banking-consent-row';
import { EnableBankingReauthorizeRow } from '../enable-banking-reauthorize-row/enable-banking-reauthorize-row';

const REAUTHORIZE_LEAD_MS = 7 * 24 * 60 * 60 * 1000;

export const EnableBankingConnectionCard = () => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const syncs = useBankIntegrationSyncsQuery(integration.id);
    const [nowMs] = useState(Date.now);

    const token = Option.getOrNull(decodeEnableBankingToken(integration.token));
    const validUntilMs = Date.parse(token?.validUntil ?? '');
    const validUntil = Number.isFinite(validUntilMs) ? new Date(validUntilMs) : null;
    const hasErrorCode = (errorCode: SyncErrorCodeEnum) => syncs.some(sync => sync.lastErrorCode === errorCode);
    const isConsentExpired = !isDefined(validUntil) || validUntil.getTime() < nowMs || hasErrorCode(SyncErrorCodeEnum.CONSENT_EXPIRED);
    const isConsentEnding = validUntilMs - nowMs < REAUTHORIZE_LEAD_MS;
    const isNotLinked = hasErrorCode(SyncErrorCodeEnum.ACCOUNT_NOT_LINKED);
    const needsKey = isDefined(token) && hasErrorCode(SyncErrorCodeEnum.UNAUTHORIZED);

    return (
        <GroupedListSection
            title={t`Connection`}
            footer={t`Requests go from this phone to Enable Banking and your bank. Budgie has no server.`}
        >
            <EnableBankingConsentRow validUntil={validUntil} nowMs={nowMs} isExpired={isConsentExpired} isEnding={isConsentEnding} />
            {isNotLinked ? (
                <EnableBankingReauthorizeRow subtitle={t`An account is not linked. Link it in Enable Banking, then authorize.`} />
            ) : null}
            {!isNotLinked && (isConsentExpired || isConsentEnding) ? (
                <EnableBankingReauthorizeRow subtitle={t`Renews bank consent for syncing.`} />
            ) : null}
            {needsKey ? <EnableBankingChooseKeyRow applicationId={token.applicationId} /> : null}
        </GroupedListSection>
    );
};
