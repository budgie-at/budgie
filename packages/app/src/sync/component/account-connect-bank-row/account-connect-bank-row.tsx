import { ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { isLiveSync } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useAccountSync } from '../../hook/use-account-sync.hook';
import { EnableBankingConnectionService } from '../../service/enable-banking-connection.service';

import { AccountConnectBankRowSelector } from './account-connect-bank-row.selector';

interface Props {
    readonly accountId: number;
}

export const AccountConnectBankRow = ({ accountId }: Props) => {
    const { t } = useLingui();
    const { sync } = useAccountSync(accountId);
    const { isLoading, run } = useSingleFlight();

    if (isDefined(sync) && isLiveSync(sync)) {
        return null;
    }

    const handlePress = () =>
        run(
            Effect.flatMap(EnableBankingConnectionService, connection => connection.findSavedApplicationId()).pipe(
                Effect.tap(savedApplicationId =>
                    Effect.sync(() => {
                        router.push({
                            pathname: '/create-account/[type]',
                            params: {
                                type: ExternalSourceEnum.ENABLE_BANKING,
                                connectAccountId: String(accountId),
                                ...(isDefined(savedApplicationId) && { savedApplicationId })
                            }
                        });
                    })
                ),
                toastOnFailure(t`Could not start the authorization`)
            )
        );

    return (
        <GroupedListSection
            footer={t`Keeps this account and its history. New transactions come from your bank, starting the day after the last one.`}
        >
            <LoadingContent isLoading={isLoading}>
                <GroupedListRow
                    left={<GroupedListIcon icon={UserIconNameEnum.Landmark} />}
                    title={t`Connect to bank`}
                    onPress={handlePress}
                    testID={AccountConnectBankRowSelector.Row}
                />
            </LoadingContent>
        </GroupedListSection>
    );
};
