import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { router } from 'expo-router';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';
import { CreateAccountSelector } from '../../../app/(main)/create-account/create-account.selector';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';

interface Props {
    readonly title: string;
    readonly icon: UserIconNameEnum;
    readonly description: string;
    readonly type: AccountTypeEnum;
}

export const CreateAccountCard = ({ title, description, type, icon }: Props) => {
    const handleNavigate = () => void router.push({ pathname: '/create-account/[type]', params: { type } });

    return (
        <GroupedListRow
            testID={CreateAccountSelector.type(type)}
            left={
                <CircleIcon
                    icon={icon}
                    variant={ACCOUNT_COLOR[type]}
                    size={36}
                    iconSize={18}
                    radius={18}
                    border={false}
                    className={TONAL_DISC_BACKGROUND[ACCOUNT_COLOR[type]]}
                />
            }
            title={title}
            subtitle={description}
            onPress={handleNavigate}
        />
    );
};
