import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

export const InzhurActualBalanceNote = () => (
    <Text className="text-secondary-foreground px-3xl text-[13px] leading-[18px]">
        <Trans>
            Enter the balance shown in the Inzhur app. If it is higher than Budgie expects, the difference is recorded as estimated
            dividends.
        </Trans>
    </Text>
);
