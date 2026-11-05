import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';

import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly title: string;
    readonly description: string;
    readonly icon: UserIconType;
}

export const TransactionPickerEmpty = ({ title, description, icon }: Props) => (
    <View className="gap-y-xl py-3xl">
        <CircleIcon icon={icon} variant="secondary" border={false} />
        <Text dynamicTypeRamp="headline" className="text-[17px] font-semibold text-primary">
            {title}
        </Text>
        <Text dynamicTypeRamp="footnote" className="text-[13px] text-secondary-foreground">
            {description}
        </Text>
    </View>
);
