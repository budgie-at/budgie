import { useLingui } from '@lingui/react/macro';
import { TextInput, View } from 'react-native';

import { IconName } from '../../../@generic/constant/icons.constant';
import { AccountIconSelector } from '../account-icon-selector/account-icon-selector';

interface Props {
    icon: IconName;
    title: string;
    onIconSelect: (icon: IconName) => void;
    onTitleChange: (title: string) => void;
}

export const CreateAccountGeneralInfo = ({ icon, onIconSelect, title, onTitleChange }: Props) => {
    const { t } = useLingui();

    return (
        <View className={'flex-row gap-x-[12px]'}>
            <AccountIconSelector icon={icon} onSelect={onIconSelect} />

            <TextInput
                value={title}
                onChangeText={onTitleChange}
                placeholder={t`e.g. Chase Checking`}
                className={
                    'text-ellipsis text-[18px] h-[62px] px-[16px] text-primary border placeholder-secondary-reverse-foreground border-secondary-corner rounded-[16px] flex-1'
                }
            />
        </View>
    );
};
