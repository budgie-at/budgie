import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HorizontalCell } from '../../../@generic/component/horizontal-cell/horizontal-cell';
import { Icon } from '../../../@generic/component/icon/icon';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { useBankIntegrationKeyModal } from '../../context/bank-integration-key-modal.context';
import { useBankIntegration } from '../../context/bank-integration.context';
import { maskToken } from '../../utils/mask-token.util';

export const BankIntegrationKeyCard = () => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const [openKeyModal] = useBankIntegrationKeyModal();

    const handlePress = () => void openKeyModal(integration.id);

    return (
        <HorizontalCell
            onPress={handlePress}
            left={<CircleIcon icon={UserIconNameEnum.KeyRound} border={false} size={36} iconSize={20} />}
            right={<Icon className="text-primary ml-auto" icon={UserIconNameEnum.ChevronRight} size={20} />}
            testID={BankIntegrationSelector.KeyCard}
        >
            <Text className="text-sm font-medium text-primary">{t`API key`}</Text>
            <Text className="text-sm font-medium font-mono text-secondary-foreground" numberOfLines={1}>
                {maskToken(integration.token)}
            </Text>
        </HorizontalCell>
    );
};
