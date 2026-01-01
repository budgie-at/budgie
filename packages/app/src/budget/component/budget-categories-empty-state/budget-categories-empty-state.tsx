import { Trans, useLingui } from '@lingui/react/macro';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly budgetId: number;
}

export const BudgetCategoriesEmptyState = ({ budgetId }: Props) => {
    const { t } = useLingui();

    return (
        <View className="items-center py-8">
            <Icon icon="Layers" size={32} className="text-secondary-foreground mb-2" />
            <Text className="text-sm text-secondary-foreground">
                <Trans>No categories added yet</Trans>
            </Text>
            <Link href={`/budget/${budgetId}/add-allocation`} asChild>
                <Button variant="ghost" content={t`Add Category`} className="mt-2" />
            </Link>
        </View>
    );
};

