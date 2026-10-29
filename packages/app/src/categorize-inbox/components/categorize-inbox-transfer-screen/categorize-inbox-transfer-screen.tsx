import { TransactionTypeEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { SearchInput } from '../../../@generic/component/search-input/search-input';
import { testID } from '../../../@generic/utils/test-id.util';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxCluster } from '../../hook/use-categorize-inbox-cluster.hook';
import { CategorizeInboxScreenChrome } from '../categorize-inbox-screen-chrome/categorize-inbox-screen-chrome';
import { CategorizeInboxScreenScroll } from '../categorize-inbox-screen-scroll/categorize-inbox-screen-scroll';
import { CategorizeInboxScreenTitle } from '../categorize-inbox-screen-title/categorize-inbox-screen-title';
import { CategorizeInboxTransferAccounts } from '../categorize-inbox-transfer-accounts/categorize-inbox-transfer-accounts';
import { CategorizeInboxTransferRuleSwitch } from '../categorize-inbox-transfer-rule-switch/categorize-inbox-transfer-rule-switch';

import { CategorizeInboxTransferScreenSelector } from './categorize-inbox-transfer-screen.selector';

interface Props {
    readonly clusterKey: string;
}

export const CategorizeInboxTransferScreen = ({ clusterKey }: Props) => {
    const { t } = useLingui();
    const { cluster } = useCategorizeInboxCluster(clusterKey);
    const { includedRows } = useCategorizeInboxContext();
    const [search, setSearch] = useState('');
    const [isRuleEnabled, setIsRuleEnabled] = useState(true);

    if (!isDefined(cluster)) {
        return null;
    }

    const paymentCount = includedRows(cluster).length;
    const isIncome = cluster.rows.at(0)?.type === TransactionTypeEnum.INCOME;
    const summary = isIncome ? (
        <Trans>{paymentCount} payments become transfers and leave your income.</Trans>
    ) : (
        <Trans>{paymentCount} payments become transfers and leave your expenses.</Trans>
    );

    return (
        <CategorizeInboxScreenChrome>
            <CategorizeInboxScreenScroll>
                <CategorizeInboxScreenTitle title={t`Transfer to`}>
                    <Text className="text-secondary-foreground text-sm">{summary}</Text>
                </CategorizeInboxScreenTitle>

                <CategorizeInboxTransferRuleSwitch cluster={cluster} value={isRuleEnabled} onValueChange={setIsRuleEnabled} />

                <View className="pt-xl">
                    <SearchInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder={t`Search accounts...`}
                        {...testID(CategorizeInboxTransferScreenSelector.Search)}
                    />
                </View>

                <CategorizeInboxTransferAccounts cluster={cluster} search={search} isRuleEnabled={isRuleEnabled} />
            </CategorizeInboxScreenScroll>
        </CategorizeInboxScreenChrome>
    );
};
