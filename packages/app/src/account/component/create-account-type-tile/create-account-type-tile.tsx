import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { CreateAccountSelector } from '../../../app/(main)/create-account/create-account.selector';
import { CREATE_ACCOUNT_TYPE_TINT } from '../../constant/create-account-type-tint.constant';

interface Props {
    readonly title: string;
    readonly description: string;
    readonly icon: UserIconNameEnum;
    readonly type: AccountTypeEnum;
}

const LABEL_MAX_FONT_SIZE_MULTIPLIER = 1.3;
const LABEL_MIN_FONT_SCALE = 0.8;

export const CreateAccountTypeTile = ({ title, description, icon, type }: Props) => {
    const handleNavigate = () => void router.push({ pathname: '/create-account/[type]', params: { type } });

    return (
        <HapticPressable
            testID={CreateAccountSelector.type(type)}
            accessibilityRole="button"
            accessibilityLabel={title}
            accessibilityHint={description}
            onPress={handleNavigate}
            className="min-w-0 basis-1/3 md:basis-1/6 items-center gap-y-sm px-xxs py-xl active:opacity-70"
        >
            <CircleIcon
                icon={icon}
                size={52}
                iconSize={24}
                radius={14}
                border={false}
                className={CREATE_ACCOUNT_TYPE_TINT[type]?.tileClassName}
                iconClassName={CREATE_ACCOUNT_TYPE_TINT[type]?.glyphClassName}
            />
            <Text
                className="self-stretch text-primary text-center text-[13px] leading-[16px] font-medium"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={LABEL_MIN_FONT_SCALE}
                maxFontSizeMultiplier={LABEL_MAX_FONT_SIZE_MULTIPLIER}
            >
                {title}
            </Text>
        </HapticPressable>
    );
};
