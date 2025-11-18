import { Text } from 'react-native';

import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ICONS, IconName } from '../../../@generic/constant/icons.constant';

interface Props {
    onOpen: (id: number) => void;
    id: number;
    title: string;
    icon: IconName;
}

export const CategoryCard = ({ onOpen, id, title, icon }: Props) => {
    const handleOpen = () => void onOpen(id);

    return (
        <Card onPress={handleOpen} className={'flex-row gap-x-xl items-center'}>
            <CircleIcon icon={ICONS[icon]} size={'xl'} variant={'default'} />
            <Text className={'text-primary text-sm'}>{title}</Text>
        </Card>
    );
};
