import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { router } from 'expo-router';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { CreateAccountSelector } from '../../../app/(main)/create-account/create-account.selector';
import { CREATE_ACCOUNT_TYPE_TINT } from '../../constant/create-account-type-tint.constant';

interface Props {
    readonly title: string;
    readonly description: string;
    readonly icon: UserIconNameEnum;
    readonly type: AccountTypeEnum;
}

export const CreateAccountTypeRow = ({ title, description, icon, type }: Props) => {
    const handleNavigate = () => void router.push({ pathname: '/create-account/[type]', params: { type } });

    return (
        <GroupedListRow
            testID={CreateAccountSelector.type(type)}
            left={
                <CircleIcon
                    icon={icon}
                    size={36}
                    iconSize={20}
                    radius={10}
                    border={false}
                    className={CREATE_ACCOUNT_TYPE_TINT[type]?.tileClassName}
                    iconClassName={CREATE_ACCOUNT_TYPE_TINT[type]?.glyphClassName}
                />
            }
            title={title}
            subtitle={description}
            onPress={handleNavigate}
        />
    );
};
