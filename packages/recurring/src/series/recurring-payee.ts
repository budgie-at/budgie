import * as Arr from 'effect/Array';

import { isNotEmptyString } from '@rnw-community/shared';

import { normalizeRecurringDescription } from '../utils/normalize-recurring-description.util';

import { description, identity } from './recurring-series';

import type { RecurringChargeInterface } from '../interface/recurring-charge.interface';

const GENERIC_TITLE_IBANS = 3;
const MINIMUM_PREFIX_TOKENS = 2;

const isSequential = ([firstStart, firstEnd]: readonly number[], [secondStart, secondEnd]: readonly number[]): boolean =>
    firstEnd < secondStart || secondEnd < firstStart;

const makeUnion = (spans: Map<string, readonly number[]>) => {
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
            const [firstRoot, secondRoot] = [find(first), find(second)];
            const [firstSpan, secondSpan] = [spans.get(firstRoot) ?? [], spans.get(secondRoot) ?? []];
            if (firstRoot !== secondRoot && isSequential(firstSpan, secondSpan)) {
                parents.set(firstRoot, secondRoot);
                spans.set(secondRoot, [Math.min(firstSpan[0], secondSpan[0]), Math.max(firstSpan[1], secondSpan[1])]);
            }
        }
    };
};

const joinCompatibleTitles = (titles: readonly string[], join: (first: string, second: string) => void): void => {
    const shorterByHead = Arr.groupBy(
        titles.filter(title => title.includes(' ')),
        title => `${title.split(' ').length}|${title.slice(0, title.lastIndexOf(' '))}`
    );
    for (const title of titles) {
        const tokens = title.split(' ');
        for (let length = MINIMUM_PREFIX_TOKENS; length <= tokens.length; length += 1) {
            for (const shorter of shorterByHead[`${length}|${tokens.slice(0, length - 1).join(' ')}`] ?? []) {
                if (shorter !== title && tokens[length - 1].startsWith(shorter.slice(shorter.lastIndexOf(' ') + 1))) {
                    join(shorter, title);
                }
            }
        }
    }
};

export const groupRecurringPayees = (charges: readonly RecurringChargeInterface[]): RecurringChargeInterface[][] => {
    const titleOf = new Map(charges.map(charge => [charge, normalizeRecurringDescription(description(charge))]));
    const titleNode = (charge: RecurringChargeInterface): string => `${charge.kind}|${charge.instrumentId}|${titleOf.get(charge)}`;
    const ownNode = (charge: RecurringChargeInterface): string =>
        isNotEmptyString(charge.counterpartyIban) ? `I|${identity(charge)}` : titleNode(charge);
    const payees = Arr.groupBy(charges, ownNode);
    const payeesByTitle = new Map(
        Object.entries(
            Arr.groupBy(
                charges.filter(charge => isNotEmptyString(titleOf.get(charge))),
                titleNode
            )
        )
            .map(([title, group]) => [title, [...new Set(group.map(ownNode))]] as const)
            .filter(([title, nodes]) => nodes.filter(node => node !== title).length <= GENERIC_TITLE_IBANS)
    );
    const { find, join } = makeUnion(
        new Map(
            Object.entries(payees).map(([node, group]) => {
                const times = group.map(charge => charge.operatedAt.getTime());

                return [node, [Math.min(...times), Math.max(...times)]];
            })
        )
    );
    const joinTitles = (first: string, second: string): void => {
        for (const firstNode of payeesByTitle.get(first) ?? []) {
            for (const secondNode of payeesByTitle.get(second) ?? []) {
                join(firstNode, secondNode);
            }
        }
    };
    for (const title of payeesByTitle.keys()) {
        joinTitles(title, title);
    }
    joinCompatibleTitles([...payeesByTitle.keys()], joinTitles);

    return Object.values(Arr.groupBy(charges, charge => find(ownNode(charge))));
};
