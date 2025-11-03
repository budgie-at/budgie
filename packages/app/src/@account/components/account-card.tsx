import { HouseIcon } from 'lucide-react-native';

import { Card } from '../../@generic/components/card/card';
import { CircleIcon } from '../../@generic/components/circle-icon/circle-icon';

export const AccountCard = () => (
    <Card>
        <CircleIcon border={false} icon={HouseIcon} size="xs" variant="positive" />
        <CircleIcon icon={HouseIcon} size="sm" variant="warning" />
        <CircleIcon icon={HouseIcon} size="md" variant="default" />
        <CircleIcon icon={HouseIcon} size="lg" variant="destructive" />
        <CircleIcon icon={HouseIcon} size="xl" variant="ghost" />
    </Card>
);
