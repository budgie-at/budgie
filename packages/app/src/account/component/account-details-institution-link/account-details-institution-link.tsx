import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { AccountDetailsSelector } from '../../../app/(main)/account/[id]/account-details.selector';
import { useGetBankIntegrationByIdQuery } from '../../../sync/query/use-get-bank-integration-by-id.query';
import { getInstitutionTitle } from '../../utils/get-institution-title.util';

interface Props {
    readonly integrationId: number;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const AccountDetailsInstitutionLink = ({ integrationId }: Props) => {
    const { t } = useLingui();
    const { integration, isLoading } = useGetBankIntegrationByIdQuery(integrationId);

    if (!isLoading && !isDefined(integration)) {
        return null;
    }

    const title = isDefined(integration) ? getInstitutionTitle(t, integration.provider, integration.label, null) : '';
    const handlePress = () => void router.push({ pathname: '/institution/[id]', params: { id: String(integrationId) } });

    return (
        <LoadingContent isLoading={isLoading} loadingIndicator={null} containerClassName="max-w-full self-center">
            <HapticPressable
                accessible
                accessibilityRole="button"
                accessibilityLabel={title}
                accessibilityHint={t`Opens all holdings and trades at this provider`}
                className="min-h-[44px] max-w-full flex-row items-center gap-x-md self-center rounded-full bg-surface-row px-xl active:opacity-70"
                style={CONTINUOUS_CORNERS}
                testID={AccountDetailsSelector.InstitutionLink}
                onPress={handlePress}
            >
                <BankLogo bankProvider={integration?.provider} bankName={integration?.label ?? title} size={20} />
                <Text
                    className="min-w-0 shrink py-md text-[15px] font-medium text-primary"
                    numberOfLines={1}
                    maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                >
                    {title}
                </Text>
                <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
            </HapticPressable>
        </LoadingContent>
    );
};
