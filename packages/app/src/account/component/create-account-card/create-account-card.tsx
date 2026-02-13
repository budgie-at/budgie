import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { router } from 'expo-router';

import { CreateAccountSelector } from '../../../@e2e/selectors/account-form.selector';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';

interface Props {
    readonly title: string;
    readonly icon: UserIconNameEnum;
    readonly description: string;
    readonly type: AccountTypeEnum;
}

export const CreateAccountCard = ({ title, description, type, icon }: Props) => {
    const handleNavigate = () => void router.push(`/create-account/${type}`);

    return (
        <SimpleHorizontalCell
            testID={CreateAccountSelector.Type(type)}
            size="lg"
            left={<CircleIcon icon={icon} variant={ACCOUNT_COLOR[type]} radius={20} border={false} size={52} iconSize={24} />}
            title={title}
            onPress={handleNavigate}
            description={description}
        />
    );
};
