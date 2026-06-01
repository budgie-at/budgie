import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { Card } from '../../../@generic/component/card/card';
import { BankSyncRepairsPageSelector } from '../../../app/(tabs)/settings/bank-sync-repairs-page.selector';

import type { BankSyncRepairsErrorCardPropsInterface } from './bank-sync-repairs-error-card-props.interface';

export const BankSyncRepairsErrorCard = ({ errorMessage, isLoading, onRefresh }: BankSyncRepairsErrorCardPropsInterface) => {
    const { t } = useLingui();

    return (
        <Card variant="destructive" className="gap-y-lg">
            <Text className="text-destructive-foreground text-sm font-semibold">
                <Trans>Could not check bank sync data</Trans>
            </Text>
            <Text testID={BankSyncRepairsPageSelector.ErrorText} className="text-destructive-foreground text-sm">
                {errorMessage}
            </Text>
            <Button
                testID={BankSyncRepairsPageSelector.ErrorRetryButton}
                onPress={onRefresh}
                disabled={isLoading}
                content={t`Try Again`}
                leftIcon={UserIconNameEnum.RefreshCw}
                variant="destructive"
                size="sm"
            />
        </Card>
    );
};
