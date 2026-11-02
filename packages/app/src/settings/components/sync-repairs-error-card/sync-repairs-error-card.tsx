import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { SyncRepairsPageSelector } from '../../../app/(tabs)/settings/sync-repairs-page.selector';
import { SettingsPillButton } from '../settings-pill-button/settings-pill-button';

interface Props {
    readonly errorMessage: string;
    readonly isLoading: boolean;
    readonly onRefresh: () => void;
}

export const SyncRepairsErrorCard = ({ errorMessage, isLoading, onRefresh }: Props) => {
    const { t } = useLingui();

    return (
        <GroupedListSection>
            <GroupedListRow
                title={<Text className="text-destructive-foreground text-[17px]">{t`Could not check sync data`}</Text>}
                subtitle={
                    <Text testID={SyncRepairsPageSelector.ErrorText} className="text-destructive-foreground text-[13px]" selectable>
                        {errorMessage}
                    </Text>
                }
                right={
                    <SettingsPillButton
                        testID={SyncRepairsPageSelector.ErrorRetryButton}
                        label={t`Try again`}
                        onPress={onRefresh}
                        isLoading={isLoading}
                        variant="secondary"
                    />
                }
            />
        </GroupedListSection>
    );
};
