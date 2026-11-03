import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { buildUncategorizedFilters } from '../../../transaction/utils/build-uncategorized-filters.util';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxPageSelector } from '../categorize-inbox-page/categorize-inbox-page.selector';

import type { AnalyticsTransactionsRouteParamsInterface } from '../../../transaction/interface/analytics-transactions-route-params.interface';

interface Props {
    readonly params: AnalyticsTransactionsRouteParamsInterface;
}

export const CategorizeInboxShowListButton = ({ params }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const { strategy } = useCategorizeInboxContext();

    const handlePress = (): void =>
        void router.push({
            pathname: '/analytics/transactions',
            params: strategy?.buildListRouteParams(buildUncategorizedFilters(params))
        });

    return (
        <HapticPressable
            className="ml-auto h-10 w-10 items-center justify-center"
            hitSlop={12}
            onPress={handlePress}
            testID={CategorizeInboxPageSelector.ShowListButton}
            accessibilityRole="button"
            accessibilityLabel={t`Show list`}
        >
            <Icon icon={UserIconNameEnum.List} className="text-primary" size={24} />
        </HapticPressable>
    );
};
