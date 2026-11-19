import * as Arr from 'effect/Array';

import { isNotEmptyString } from '@rnw-community/shared';

import { normalizeRecurringDescription } from '../utils/normalize-recurring-description.util';

import { description, identity } from './recurring-series';

import type { RecurringChargeInterface } from '../interface/recurring-charge.interface';

const GENERIC_TITLE_IBANS = 3;
const MINIMUM_PREFIX_TOKENS = 2;

const makeUnion = () => {
    const parents = new Map<string, string>();
    const find = (node: string): string => {
        const parent = parents.get(node) ?? node;
        if (parent === node) {
            return node;
        }
        const root = find(parent);
        parents.set(node, root);

        return root;
    };

    return {
        find,
        join: (first: string, second: string) => {
            parents.set(find(first), find(second));
        }
    };
};

const isSequential = ([firstStart, firstEnd]: readonly number[], [secondStart, secondEnd]: readonly number[]): boolean =>
    firstEnd < secondStart || secondEnd < firstStart;

const joinCompatibleTitles = (spans: ReadonlyMap<string, readonly number[]>, join: (first: string, second: string) => void): void => {
    const titles = [...spans.keys()];
    const shorterByHead = Arr.groupBy(
        titles.filter(title => title.includes(' ')),
        title => `${title.split(' ').length}|${title.slice(0, title.lastIndexOf(' '))}`
    );
    for (const title of titles) {
        const tokens = title.split(' ');
        for (let length = MINIMUM_PREFIX_TOKENS; length <= tokens.length; length += 1) {
            for (const shorter of shorterByHead[`${length}|${tokens.slice(0, length - 1).join(' ')}`] ?? []) {
                const isCompatible = shorter !== title && tokens[length - 1].startsWith(shorter.slice(shorter.lastIndexOf(' ') + 1));
                if (isCompatible && isSequential(spans.get(shorter) ?? [], spans.get(title) ?? [])) {
                    join(shorter, title);
                }
            }
        }
    }
};

export const groupRecurringPayees = (charges: readonly RecurringChargeInterface[]): RecurringChargeInterface[][] => {
    const titleOf = new Map(charges.map(charge => [charge, normalizeRecurringDescription(description(charge))]));
    const hasIban = (charge: RecurringChargeInterface): boolean => isNotEmptyString(charge.counterpartyIban);
    const titleNode = (charge: RecurringChargeInterface): string => `T|${charge.kind}|${charge.instrumentId}|${titleOf.get(charge)}`;
    const ownNode = (charge: RecurringChargeInterface): string => (hasIban(charge) ? `I|${identity(charge)}` : titleNode(charge));
    const ibanCounts = new Map(
        Object.entries(Arr.groupBy(charges.filter(hasIban), titleNode)).map(([node, group]) => [node, new Set(group.map(identity)).size])
    );
    const bridging = charges.filter(
        charge => isNotEmptyString(titleOf.get(charge)) && (ibanCounts.get(titleNode(charge)) ?? 0) <= GENERIC_TITLE_IBANS
    );
    const { find, join } = makeUnion();
    for (const charge of bridging) {
        join(ownNode(charge), titleNode(charge));
    }
    joinCompatibleTitles(
        new Map(
            Object.entries(Arr.groupBy(bridging, titleNode)).map(([node, group]) => {
                const times = group.map(charge => charge.operatedAt.getTime());

                return [node, [Math.min(...times), Math.max(...times)]];
            })
        ),
        join
    );

    return Object.values(Arr.groupBy(charges, charge => find(ownNode(charge))));
};
