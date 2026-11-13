import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { useOpenAddPosition } from '../../hook/use-open-add-position.hook';
import { BrokerageSelector } from '../../selector/brokerage.selector';

export const BrokerageEmptyState = () => {
    const { t } = useLingui();
    const handlePress = useOpenAddPosition();

    return (
        <View className="items-center gap-y-3xl px-3xl">
            <EmptyState
                circleIcon={UserIconNameEnum.ChartLine}
                title={t`No positions yet`}
                titleClassName="text-md text-primary font-semibold"
                description={t`Add a stock or ETF to see its value and return here.`}
                descriptionClassName="text-[15px] text-secondary-foreground text-center"
                className="py-0"
            />
            <Button
                variant="cta"
                size="lg"
                leftIcon={UserIconNameEnum.Plus}
                content={t`Add position`}
                onPress={handlePress}
                className="self-stretch"
                testID={BrokerageSelector.AddPositionButton}
            />
        </View>
    );
};
