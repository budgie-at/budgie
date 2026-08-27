import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { Card } from '../../../@generic/component/card/card';
import { SyncRepairsPageSelector } from '../../../app/(tabs)/settings/sync-repairs-page.selector';

interface Props {
    readonly errorMessage: string;
    readonly isLoading: boolean;
    readonly onRefresh: () => void;
}

export const SyncRepairsErrorCard = ({ errorMessage, isLoading, onRefresh }: Props) => {
    const { t } = useLingui();

    return (
        <Card variant="destructive" className="gap-y-lg">
            <Text className="text-destructive-foreground text-sm font-semibold">
                <Trans>Could not check sync data</Trans>
            </Text>
            <Text testID={SyncRepairsPageSelector.ErrorText} className="text-destructive-foreground text-sm">
                {errorMessage}
            </Text>
            <Button
                testID={SyncRepairsPageSelector.ErrorRetryButton}
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
