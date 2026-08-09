import { ExternalSourceEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { BANK_PROVIDER_TITLE } from '../../../account/constant/bank-provider-title.constant';

interface Props {
    readonly provider: ExternalSourceEnum;
    readonly onGoBack: EmptyFn;
}

export const BankIntegrationHeader = ({ provider, onGoBack }: Props) => {
    const { t } = useLingui();

    const titleDescriptor = BANK_PROVIDER_TITLE[provider];
    const title = isDefined(titleDescriptor) ? t(titleDescriptor) : provider;

    return (
        <View className="px-5xl gap-y-3xl pb-7xl">
            <View className="flex-row items-center gap-x-xl">
                <GoBackButton onPress={onGoBack} />

                <BankLogo bankProvider={provider} size={40} />

                <Text className="text-primary font-medium text-3xl flex-1" numberOfLines={1}>
                    {title}
                </Text>
            </View>
        </View>
    );
};
