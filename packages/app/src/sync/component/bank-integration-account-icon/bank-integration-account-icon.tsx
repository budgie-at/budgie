import { ExternalSourceEnum, UserIconType } from '@budgie/contracts';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';
import { useBankIntegration } from '../../context/bank-integration.context';

interface Props {
    readonly icon: UserIconType;
}

export const BankIntegrationAccountIcon = ({ icon }: Props) => {
    const { integration, capabilities } = useBankIntegration();

    if (capabilities.supportsFileImport || integration.provider === ExternalSourceEnum.ENABLE_BANKING) {
        return <BankLogo bankProvider={integration.provider} size={36} bankName={integration.label} />;
    }

    return (
        <CircleIcon
            icon={icon}
            variant="primary"
            size={36}
            iconSize={18}
            radius={18}
            border={false}
            className={TONAL_DISC_BACKGROUND.primary}
        />
    );
};
