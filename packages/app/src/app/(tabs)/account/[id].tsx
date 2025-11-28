import { CurrencyEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Redirect, router, useGlobalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Page } from '../../../@generic/components/page/page';
import { PageHeader } from '../../../@generic/components/page-header/page-header';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { IdParamInterface } from '../../../@generic/interface/id-param.interface';
import { isEnumValue } from '../../../@generic/type-guard/is-enum-value.type-guard';
import { AccountBalance } from '../../../account/component/account-balance/account-balance';
import { ACCOUNT_COLOR } from '../../../account/constant/account-color.constant';
import { ACCOUNT_TYPE } from '../../../account/constant/account-type.constant';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { useSettingsContext } from '../../../settings/context/settings.context';

const descriptionVariants = cva('uppercase', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export default function Account() {
    const params = useGlobalSearchParams<IdParamInterface>();
    const id = Number(params.id);

    const { account, isLoading } = useGetAccountByIdQuery(id);
    const { defaultCurrency } = useSettingsContext();
    const { i18n } = useLingui();

    if (isLoading) {
        return null;
    }

    if (!isDefined(account)) {
        return <Redirect href="/" />;
    }

    const navigateToEdit = () => void router.push(`/edit-account/${id}`);

    const { title, icon, currentBalance, type, instrument } = account;
    const currency = isEnumValue(instrument.code, CurrencyEnum) ? instrument.code : defaultCurrency;

    const variant = ACCOUNT_COLOR[type];

    return (
        <Page
            header={
                <PageHeader
                    showBackBtn
                    title={title}
                    icon={icon}
                    iconVariant={variant}
                    right={
                        <HapticPressable className="ml-auto" onPress={navigateToEdit}>
                            <CircleIcon icon={ICONS.EllipsisVertical} variant="ghost" size="lg" border={false} />
                        </HapticPressable>
                    }
                    description={i18n.t(ACCOUNT_TYPE[type])}
                    descriptionClassName={descriptionVariants({ variant })}
                />
            }
        >
            <View className="py-[30px]">
                <AccountBalance currency={currency} balance={currentBalance} />
            </View>
        </Page>
    );
}
