import { ExternalSourceEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { BANK_CREDENTIALS_STEP_CONFIG } from '../../constant/bank-credentials-step-config.constant';
import { GetTokenCard } from '../get-token-card/get-token-card';
import { SyncGuideSteps } from '../sync-guide-steps/sync-guide-steps';

interface Props {
    readonly provider: ExternalSourceEnum;
}

export const SyncCredentialsStepHeader = ({ provider }: Props) => {
    const { t } = useLingui();
    const config = BANK_CREDENTIALS_STEP_CONFIG[provider];

    if (!isDefined(config)) {
        return null;
    }

    const steps = config.steps.map(step => t(step));
    const { warningTitle } = config;

    return (
        <>
            <GroupedListSection>
                <GetTokenCard
                    provider={provider}
                    url={config.url}
                    title={t(config.title)}
                    description={t(config.description)}
                    modalTitle={t(config.modalTitle)}
                />
            </GroupedListSection>

            <SyncGuideSteps title={t`How to configure`} steps={steps} {...(isDefined(warningTitle) && { footer: t(warningTitle) })} />
        </>
    );
};
