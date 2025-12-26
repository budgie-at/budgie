import { AccountTypeEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { router } from 'expo-router';

import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { AccountCardContent } from '../account-card-content/account-card-content';

import type { IconName } from '../../../@generic/constant/icons.constant';

interface Props {
    readonly title: string;
    readonly icon: IconName;
    readonly description: string;
    readonly type: AccountTypeEnum;
}

const iconVariant = cva('', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export const CreateAccountCard = ({ title, description, type, icon }: Props) => {
    const handleNavigate = () => void router.push(`/create-account/${type}`);

    return (
        <Card className="p-5xl items-center flex-row gap-x-3xl active:scale-xs" onPress={handleNavigate}>
            <CircleIcon
                border={false}
                className="rounded-5xl w-[52px] h-[52px]"
                icon={ICONS[icon]}
                iconClassName={iconVariant({ variant: ACCOUNT_COLOR[type] })}
                size="xl"
                variant="ghost"
            />

            <AccountCardContent title={title} description={description} />
        </Card>
    );
};
