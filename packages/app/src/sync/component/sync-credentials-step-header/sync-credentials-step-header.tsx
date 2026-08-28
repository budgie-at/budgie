import { ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { BANK_CREDENTIALS_STEP_CONFIG } from '../../constant/bank-credentials-step-config.constant';
import { GetTokenCard } from '../get-token-card/get-token-card';
import { NumberedSteps } from '../numbered-steps/numbered-steps';

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
            <GetTokenCard
                provider={provider}
                url={config.url}
                title={t(config.title)}
                description={t(config.description)}
                modalTitle={t(config.modalTitle)}
            />

            <NumberedSteps title={t`How to configure`} steps={steps} />

            {isDefined(warningTitle) && (
                <SimpleHorizontalCell
                    left={<CircleIcon icon={UserIconNameEnum.Info} variant="warning" size={15} iconSize={15} />}
                    size="lg"
                    variant="warning"
                    title={t(warningTitle)}
                />
            )}
        </>
    );
};
