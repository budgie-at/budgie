import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { isListedSecurityType } from '../../instrument/utils/is-listed-security-type.util';

import { isFiatAccount } from './is-fiat-account.util';

import type { InstitutionGroupInterface } from '../interface/institution-group.interface';
import type { AccountAssociationEnum, AccountWithInstrumentEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';

const getPositionName = (instrument: Pick<InstrumentEntityInterface, 'type' | 'symbol' | 'code'>): string =>
    isListedSecurityType(instrument.type) ? instrument.symbol : instrument.code;

export const summarizeHoldingPositions = (
    accounts: readonly Pick<AccountWithInstrumentEntityInterface, AccountAssociationEnum.INSTRUMENT>[],
    isShownInstrument: (instrumentId: number) => boolean
): Pick<InstitutionGroupInterface, 'positionCount' | 'positionName'> => {
    const instruments = [
        ...new Map(
            accounts
                .filter(account => !isFiatAccount(account) && isShownInstrument(account.instrument.id))
                .map(account => [account.instrument.id, account.instrument] as const)
        ).values()
    ];
    const [singleInstrument, ...otherInstruments] = instruments;

    return {
        positionCount: instruments.length,
        positionName: isDefined(singleInstrument) && !isNotEmptyArray(otherInstruments) ? getPositionName(singleInstrument) : null
    };
};
