import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HorizontalCell } from '../../../@generic/component/horizontal-cell/horizontal-cell';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { useBankIntegrationKeyModal } from '../../context/bank-integration-key-modal.context';
import { useBankIntegration } from '../../context/bank-integration.context';
import { useBankIntegrationAccountPreviewsQuery } from '../../query/use-bank-integration-account-previews.query';
import { maskToken } from '../../utils/mask-token.util';

export const BankIntegrationKeyCard = () => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const [openKeyModal] = useBankIntegrationKeyModal();
    const { isKeyRejected } = useBankIntegrationAccountPreviewsQuery(integration.id);

    const handlePress = () => void openKeyModal(integration.id);
    const iconVariant = isKeyRejected ? 'destructive' : 'positive';
    const keyLabel = isKeyRejected ? t`Rejected · tap to update` : maskToken(integration.token);
    const keyLabelClassName = isKeyRejected ? 'text-destructive-foreground' : 'font-mono text-secondary-foreground';

    return (
        <HorizontalCell
            onPress={handlePress}
            left={<CircleIcon icon={UserIconNameEnum.KeyRound} variant={iconVariant} border={false} size={36} iconSize={20} />}
            right={<Icon className="text-primary ml-auto" icon={UserIconNameEnum.ChevronRight} size={20} />}
            testID={BankIntegrationSelector.KeyCard}
        >
            <Text className="text-sm font-medium text-primary">{t`API key`}</Text>
            <Text className={cn('text-sm font-medium', keyLabelClassName)} numberOfLines={1}>
                {keyLabel}
            </Text>
        </HorizontalCell>
    );
};
