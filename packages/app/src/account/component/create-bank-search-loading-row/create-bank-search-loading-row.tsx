import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';

const BUSY_STATE = { busy: true };

export const CreateBankSearchLoadingRow = () => {
    const { t } = useLingui();

    return (
        <View accessible accessibilityRole="progressbar" accessibilityLabel={t`Loading banks`} accessibilityState={BUSY_STATE}>
            <LoadingContent isLoading>
                <GroupedListRow title={t`Loading banks`} subtitle={t`Sign in on your bank's own page`} />
            </LoadingContent>
        </View>
    );
};
