import { ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { BANK_CREDENTIALS_STEP_CONFIG } from '../../constant/bank-credentials-step-config.constant';
import { GetTokenCard } from '../get-token-card/get-token-card';

interface Props {
    readonly provider: ExternalSourceEnum;
}

export const BankCredentialsStepHeader = ({ provider }: Props) => {
    const { t } = useLingui();
    const config = BANK_CREDENTIALS_STEP_CONFIG[provider];

    if (!isDefined(config)) {
        return null;
    }

    return (
        <>
            <GetTokenCard
                provider={provider}
                url={config.url}
                title={t(config.title)}
                description={t(config.description)}
                modalTitle={t(config.modalTitle)}
            />

            <SimpleHorizontalCell
                left={<CircleIcon icon={UserIconNameEnum.Info} variant="warning" size={15} iconSize={15} />}
                size="lg"
                variant="warning"
                title={t(config.warningTitle)}
            />
        </>
    );
};
