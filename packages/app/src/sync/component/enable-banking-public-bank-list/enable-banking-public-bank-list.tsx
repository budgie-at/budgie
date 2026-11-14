import { ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { useAtomRefresh, useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { router } from 'expo-router';
import { View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { SearchablePageErrorState } from '../../../@generic/component/searchable-page-error-state/searchable-page-error-state';
import { CreateAccountSelector } from '../../../app/(main)/create-account/create-account.selector';
import { enableBankingPublicBanksAtom } from '../../constant/enable-banking-public-banks-atom.constant';
import { openEnableBankingBank } from '../../utils/open-enable-banking-bank.util';
import { EnableBankingBankStep } from '../enable-banking-bank-step/enable-banking-bank-step';

import type { EnableBankingBankInterface } from '@budgie/sync';

const NO_BANKS: readonly EnableBankingBankInterface[] = [];

const handleOpenGenericFlow = () =>
    void router.push({ pathname: '/create-account/[type]', params: { type: ExternalSourceEnum.ENABLE_BANKING } });

const handleGoBack = () => {
    router.back();
};

export const EnableBankingPublicBankList = () => {
    const { t } = useLingui();
    const result = useAtomValue(enableBankingPublicBanksAtom);
    const retry = useAtomRefresh(enableBankingPublicBanksAtom);
    const isLoading = AsyncResult.isInitial(result) || result.waiting;
    const errorState = AsyncResult.isFailure(result) && !isLoading ? <SearchablePageErrorState onRetry={retry} /> : null;

    return (
        <EnableBankingBankStep
            banks={AsyncResult.getOrElse(result, () => NO_BANKS)}
            isLoading={isLoading}
            errorState={errorState}
            preselectedBankName={null}
            onSelectBank={openEnableBankingBank}
            onGoBack={handleGoBack}
        >
            <View className="self-stretch pt-3xl">
                <GroupedListSection footer={t`Read-only through Enable Banking. You sign in on your bank's own page.`}>
                    <GroupedListRow
                        testID={CreateAccountSelector.bankProvider(ExternalSourceEnum.ENABLE_BANKING)}
                        left={
                            <CircleIcon
                                icon={UserIconNameEnum.Landmark}
                                size={36}
                                iconSize={20}
                                radius={10}
                                border={false}
                                className="bg-[#8E8E93]/15 dark:bg-[#8E8E93]/25"
                                iconClassName="text-[#636366] dark:text-[#AEAEB2]"
                            />
                        }
                        title={t`Can't find your bank?`}
                        subtitle={t`Use your own Enable Banking key`}
                        onPress={handleOpenGenericFlow}
                    />
                </GroupedListSection>
            </View>
        </EnableBankingBankStep>
    );
};
