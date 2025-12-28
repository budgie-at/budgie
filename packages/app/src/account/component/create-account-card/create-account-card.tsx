import { AccountTypeEnum } from '@budgie/contracts';
import { router } from 'expo-router';

import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';

import type { IconName } from '../../../@generic/constant/icons.constant';

interface Props {
    readonly title: string;
    readonly icon: IconName;
    readonly description: string;
    readonly type: AccountTypeEnum;
}

export const CreateAccountCard = ({ title, description, type, icon }: Props) => {
    const handleNavigate = () => void router.push(`/create-account/${type}`);

    const iconParams = { variant: ACCOUNT_COLOR[type], radius: 20, border: false, size: 52, iconSize: 24 };

    return <SimpleHorizontalCell size='lg' icon={icon} title={title} onPress={handleNavigate} description={description} iconParams={iconParams} />;
};
