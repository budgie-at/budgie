import { Card } from '../../@generic/components/card/card';
import { Chip } from '../../@generic/components/chip/chip';
import { HouseIcon } from 'lucide-react-native';

export const AccountCard = () => (
    <Card className="flex-row flex-wrap gap-2">
        <Chip isSelected label="Chip asdasd1" icon={HouseIcon} />
        <Chip label="Chip 2 asdasd asdasda asdasd" icon={HouseIcon} />
        <Chip label="Chip 3" />
    </Card>
);
