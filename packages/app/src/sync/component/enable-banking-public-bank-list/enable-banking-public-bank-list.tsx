import { ExternalSourceEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { router } from 'expo-router';
import { View } from 'react-native';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { CreateAccountSelector } from '../../../app/(main)/create-account/create-account.selector';
import { enableBankingPublicBanksAtom } from '../../constant/enable-banking-public-banks-atom.constant';
import { EnableBankingBankStep } from '../enable-banking-bank-step/enable-banking-bank-step';

import type { EnableBankingBankInterface } from '@budgie/sync';

const NO_BANKS: readonly EnableBankingBankInterface[] = [];

const handleSelectBank = (bank: EnableBankingBankInterface) => {
    router.push({ pathname: '/create-account/bank/[country]/[name]', params: { country: bank.country, name: bank.name } });
};

const handleOpenGenericFlow = () =>
    void router.push({ pathname: '/create-account/[type]', params: { type: ExternalSourceEnum.ENABLE_BANKING } });

const handleGoBack = () => {
    router.back();
};

export const EnableBankingPublicBankList = () => {
    const { t } = useLingui();
    const result = useAtomValue(enableBankingPublicBanksAtom);

    return (
        <EnableBankingBankStep
            banks={AsyncResult.getOrElse(result, () => NO_BANKS)}
            isLoading={AsyncResult.isInitial(result)}
            preselectedBankName={null}
            onSelectBank={handleSelectBank}
            onGoBack={handleGoBack}
        >
            <View className="self-stretch pt-3xl">
                <GroupedListSection>
                    <GroupedListRow
                        testID={CreateAccountSelector.bankProvider(ExternalSourceEnum.ENABLE_BANKING)}
                        left={<BankLogo bankProvider={ExternalSourceEnum.ENABLE_BANKING} size={36} />}
                        title={t`Bank not listed?`}
                        subtitle={t`Set up Enable Banking to see every bank`}
                        onPress={handleOpenGenericFlow}
                    />
                </GroupedListSection>
            </View>
        </EnableBankingBankStep>
    );
};
