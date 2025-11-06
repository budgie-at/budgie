import { AccountCreateEntitySchema, AccountTypeEnum, CurrencyEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Edges } from 'react-native-safe-area-context';

import { Button } from '../../../@generic/components/button/button';
import { CurrencySelector } from '../../../@generic/components/currency-selector/currency-selector';
import { Page } from '../../../@generic/components/page/page';
import { IconName } from '../../../@generic/constant/icons.constant';
import { useVibration } from '../../../@generic/hooks/use-vibration.hook';
import { createAccountMutation } from '../../mutation/create-account.mutation';
import { AccountBalanceInput } from '../account-balance-input/account-balance-input';
import { CreateAccountGeneralInfo } from '../create-account-general-info/create-account-general-info';
import { CreateAccountGroup } from '../create-account-group/create-account-group';
import { CreateAccountHeader } from '../create-account-header/create-account-header';

const safeEdges: Edges = ['top', 'bottom'];
const DEFAULT_ICON: IconName = 'Home';

export const CreateAccountBank = () => {
    const [currency, setCurrency] = useState<CurrencyEnum>(CurrencyEnum.USD);
    const [icon, setIcon] = useState<IconName>(DEFAULT_ICON);
    const [title, setTitle] = useState('');
    const [, hapticImpact] = useVibration();
    const { t } = useLingui();

    const handleCreate = async () => {
        hapticImpact(ImpactFeedbackStyle.Light);

        await createAccountMutation({
            title,
            currency,
            balance: 0,
            type: AccountTypeEnum.BANK
        });

        if (router.canDismiss()) {
            router.dismissAll();
        } else {
            router.replace('/');
        }
    };

    const isValid = AccountCreateEntitySchema.safeParse({
        title,
        currency,
        balance: 0,
        type: AccountTypeEnum.BANK
    }).success;

    return (
        <Page
            safeEdges={safeEdges}
            header={<CreateAccountHeader className={'pb-[40px]'} />}
            footer={
                <View className={'pt-[15px] px-[20px] border-t-1 border-t-secondary-corner'}>
                    <Button isDisabled={!isValid} onPress={handleCreate} content={t`Submit`} />
                </View>
            }
        >
            <View className={'py-[16px]'}>
                <AccountBalanceInput className={'pb-[40px]'} textClassName={'text-primary'} accountType={AccountTypeEnum.BANK} />

                <View className={'gap-y-[20px]'}>
                    <CreateAccountGroup title={t`Account Name & Icon`}>
                        <CreateAccountGeneralInfo title={title} onTitleChange={setTitle} icon={icon} onIconSelect={setIcon} />
                    </CreateAccountGroup>

                    <CreateAccountGroup title={t`Currency`}>
                        <CurrencySelector currencyCode={currency} onCurrencyCodeSelect={setCurrency} />
                    </CreateAccountGroup>
                </View>
            </View>
        </Page>
    );
};
