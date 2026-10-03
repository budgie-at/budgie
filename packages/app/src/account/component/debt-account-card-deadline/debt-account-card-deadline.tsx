import { UserIconNameEnum } from '@budgie/contracts';
import { cn } from 'cn';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { isDebtDeadlineUrgent } from '../../utils/is-debt-deadline-urgent.util';

interface Props {
    readonly createdAt: Date;
    readonly deadline: Date;
}

export const DebtAccountCardDeadline = ({ createdAt, deadline }: Props) => {
    const { formatCompactFullDate } = useFormatDate();

    const isUrgent = isDebtDeadlineUrgent(createdAt, deadline);
    const backgroundClassName = isUrgent ? 'bg-dark-warning-background' : 'bg-ghost-background';
    const textClassName = isUrgent ? 'text-dark-warning-foreground' : 'text-secondary-foreground';

    return (
        <View className={cn('shrink-0 flex-row items-center gap-x-xs self-start rounded-full px-md py-xxs', backgroundClassName)}>
            <Icon icon={UserIconNameEnum.Calendar} className={textClassName} size={11} />
            <Text className={cn('text-xxs font-medium tabular-nums', textClassName)}>{formatCompactFullDate(deadline)}</Text>
        </View>
    );
};
