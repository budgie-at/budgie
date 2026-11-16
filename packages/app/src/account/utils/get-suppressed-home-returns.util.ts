import type { HomeHoldingInterface } from '../interface/home-holding.interface';
import type { InstitutionGroupInterface } from '../interface/institution-group.interface';
import type { SuppressedHomeReturnsInterface } from '../interface/suppressed-home-returns.interface';
import type { AccountWithSyncEntityInterface } from '@budgie/contracts';

export const getSuppressedHomeReturns = (
    sections: readonly {
        readonly holdings: readonly (Pick<HomeHoldingInterface, 'instrument'> & {
            readonly accounts: readonly Pick<AccountWithSyncEntityInterface, 'integrationId'>[];
        })[];
        readonly cashProviders: readonly Pick<InstitutionGroupInterface, 'integrationId'>[];
    }[]
): SuppressedHomeReturnsInterface => ({
    instrumentIds: new Set(
        sections.flatMap(({ holdings }) => (holdings.length === 1 ? holdings.map(holding => holding.instrument.id) : []))
    ),
    integrationIds: new Set(
        sections.flatMap(({ holdings, cashProviders }) =>
            cashProviders.length === 1 &&
            holdings.every(holding => holding.accounts.every(account => account.integrationId === cashProviders[0].integrationId))
                ? [cashProviders[0].integrationId]
                : []
        )
    )
});
