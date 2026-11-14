import { UserIconNameEnum } from '@budgie/contracts';
import { router } from 'expo-router';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { CreateAccountSelector } from '../../../app/(main)/create-account/create-account.selector';

interface Props {
    readonly title: string;
    readonly subtitle: string;
}

export const CreateMoreBanksCard = ({ title, subtitle }: Props) => {
    const handleNavigate = () => void router.push('/create-account/banks');

    return (
        <GroupedListRow
            testID={CreateAccountSelector.MoreBanks}
            left={
                <CircleIcon
                    icon={UserIconNameEnum.Landmark}
                    size={36}
                    iconSize={20}
                    radius={10}
                    border={false}
                    className="bg-[#007AFF] dark:bg-[#0A84FF]"
                    iconClassName="text-white"
                />
            }
            title={title}
            subtitle={subtitle}
            onPress={handleNavigate}
        />
    );
};
