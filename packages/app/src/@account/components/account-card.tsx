import { Card } from '../../@generic/components/card/card';
import { Chip } from '../../@generic/components/chip/chip';

export const AccountCard = () => (
    <Card className="flex-row flex-wrap">
        <Chip isSelected label="Chip asdasd1" />
        <Chip label="Chip 2 asdasd asdasda asdasd" />
        <Chip label="Chip 3" />
    </Card>
);
