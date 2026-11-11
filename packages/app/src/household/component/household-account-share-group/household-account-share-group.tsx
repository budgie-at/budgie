import { useState } from 'react';
import Animated from 'react-native-reanimated';

import { PRESENCE_ENTERING, PRESENCE_EXITING } from '../../../@generic/constant/presence-motion.constant';
import { HouseholdAccountShareGroupRow } from '../household-account-share-group-row/household-account-share-group-row';
import { HouseholdAccountShareRow } from '../household-account-share-row/household-account-share-row';

import type { HouseholdAccountShareEntryInterface } from '../../interface/household-account-share-entry.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly groupKey: string;
    readonly title: string;
    readonly left: ReactNode;
    readonly accounts: readonly HouseholdAccountShareEntryInterface[];
}

export const HouseholdAccountShareGroup = ({ groupKey, title, left, accounts }: Props) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleToggle = () => void setIsExpanded(!isExpanded);

    return (
        <>
            <HouseholdAccountShareGroupRow
                groupKey={groupKey}
                title={title}
                left={left}
                accounts={accounts}
                isExpanded={isExpanded}
                onToggle={handleToggle}
            />
            {isExpanded
                ? accounts.map(account => (
                      <Animated.View key={account.id} entering={PRESENCE_ENTERING} exiting={PRESENCE_EXITING} className="pl-[48px]">
                          <HouseholdAccountShareRow account={account} />
                      </Animated.View>
                  ))
                : null}
        </>
    );
};
