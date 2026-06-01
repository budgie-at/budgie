import { UserIconNameEnum } from '@budgie/contracts';

import { Button } from '../../../@generic/component/button/button';
import { BankSyncRepairsPageSelector } from '../../../app/(tabs)/settings/bank-sync-repairs-page.selector';

import type { BankSyncRepairsRepairButtonPropsInterface } from './bank-sync-repairs-repair-button-props.interface';

export const BankSyncRepairsRepairButton = ({ content, disabled, isLoading, onPress }: BankSyncRepairsRepairButtonPropsInterface) => (
        <Button
            testID={BankSyncRepairsPageSelector.RepairButton}
            onPress={onPress}
            disabled={disabled}
            isLoading={isLoading}
            content={content}
            leftIcon={UserIconNameEnum.Wrench}
            variant="destructive"
        />
    );
