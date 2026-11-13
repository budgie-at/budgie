import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { CreateAccountSelector } from '../../../app/(main)/create-account/create-account.selector';

interface Props {
    readonly title: string;
    readonly description: string;
    readonly icon: UserIconNameEnum;
    readonly type: AccountTypeEnum;
}

const typeClassNames: Partial<Record<AccountTypeEnum, { readonly tileClassName: string; readonly glyphClassName: string }>> = {
    [AccountTypeEnum.BANK]: { tileClassName: 'bg-[#007AFF]/15 dark:bg-[#0A84FF]/25', glyphClassName: 'text-[#007AFF] dark:text-[#0A84FF]' },
    [AccountTypeEnum.CASH]: { tileClassName: 'bg-[#34C759]/15 dark:bg-[#30D158]/25', glyphClassName: 'text-[#248A3D] dark:text-[#30D158]' },
    [AccountTypeEnum.CRYPTO]: {
        tileClassName: 'bg-[#FF9500]/15 dark:bg-[#FF9F0A]/25',
        glyphClassName: 'text-[#C93400] dark:text-[#FF9F0A]'
    },
    [AccountTypeEnum.STOCKS]: {
        tileClassName: 'bg-[#FF2D55]/15 dark:bg-[#FF375F]/25',
        glyphClassName: 'text-[#D30F45] dark:text-[#FF375F]'
    },
    [AccountTypeEnum.DEBT]: { tileClassName: 'bg-[#FF3B30]/15 dark:bg-[#FF453A]/25', glyphClassName: 'text-[#D70015] dark:text-[#FF453A]' },
    [AccountTypeEnum.DEPOSIT]: {
        tileClassName: 'bg-[#AF52DE]/15 dark:bg-[#BF5AF2]/25',
        glyphClassName: 'text-[#8944AB] dark:text-[#BF5AF2]'
    }
};

const LABEL_MAX_FONT_SIZE_MULTIPLIER = 1.3;

export const CreateAccountTypeTile = ({ title, description, icon, type }: Props) => {
    const handleNavigate = () => void router.push({ pathname: '/create-account/[type]', params: { type } });

    return (
        <HapticPressable
            testID={CreateAccountSelector.type(type)}
            accessibilityRole="button"
            accessibilityLabel={title}
            accessibilityHint={description}
            onPress={handleNavigate}
            className="min-w-0 basis-1/3 items-center gap-y-sm px-xxs py-xl active:opacity-70"
        >
            <CircleIcon
                icon={icon}
                size={52}
                iconSize={24}
                radius={14}
                border={false}
                className={typeClassNames[type]?.tileClassName}
                iconClassName={typeClassNames[type]?.glyphClassName}
            />
            <Text
                className="min-h-[30px] text-primary text-center text-[12px] leading-[15px] font-medium"
                numberOfLines={2}
                maxFontSizeMultiplier={LABEL_MAX_FONT_SIZE_MULTIPLIER}
            >
                {title}
            </Text>
        </HapticPressable>
    );
};
