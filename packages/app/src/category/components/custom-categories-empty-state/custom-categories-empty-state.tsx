import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';

interface Props {
    readonly search: string;
}

export const CustomCategoriesEmptyState = ({ search }: Props) => {
    const { t } = useLingui();

    const icon = isNotEmptyString(search) ? 'Search' : 'Folder';
    const title = isNotEmptyString(search) ? t`No Results` : t`No Custom Categories`;
    const description = isNotEmptyString(search) ? t`No categories match your search` : t`Custom categories you create will appear here`;

    return (
        <View className="items-center pt-[70px] flex-1">
            <View className="bg-secondary-background p-3xl rounded-3xl mb-3xl">
                <Icon icon={ICONS[icon]} className="text-secondary-foreground" size={32} />
            </View>

            <Text className="text-primary text-lg mb-md">{title}</Text>
            <Text className="text-secondary-foreground text-sm">{description}</Text>
        </View>
    );
};
