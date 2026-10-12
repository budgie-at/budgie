import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { TransactionFilterChip } from '../transaction-filter-chip/transaction-filter-chip';

import type { UserIconNameEnum } from '@budgie/contracts';

interface IdsFilterValue {
    readonly value: number[] | null;
}

interface Props {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly activeLabel: string;
    readonly testID: string;
    readonly activeTestID?: string;
    readonly value: number[] | null;
    readonly open: (params: IdsFilterValue) => Promise<IdsFilterValue | null | undefined>;
    readonly onChange: (value: number[] | null) => void;
}

export const TransactionIdsFilterChip = ({ icon, label, activeLabel, testID, activeTestID = testID, value, open, onChange }: Props) => {
    const isActive = isPositiveNumber(value?.length ?? 0);

    const handleOpen = async () => {
        const result = await open({ value });

        if (isDefined(result)) {
            onChange(result.value);
        }
    };

    const chipLabel = isActive ? activeLabel : label;
    const chipTestID = isActive ? activeTestID : testID;

    return <TransactionFilterChip isActive={isActive} icon={icon} label={chipLabel} onPress={handleOpen} testID={chipTestID} />;
};
