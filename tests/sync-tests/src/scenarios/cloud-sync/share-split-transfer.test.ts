import { TestSeedService } from '@budgie-at/test-kit';
import { SyncZoneRoleEnum } from '@budgie/contracts';
import { describe, expect } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { testDb } from '../../harness';

import { refreshAllBalances } from './apply-harness';
import { HOUSEHOLD_ZONE, PERSONAL_ZONE, countRows, pullZones, queryRows, uploadDevice } from './share-harness';
import { shareDevices, expectLedgers, expectNoRejections, pullHousehold, shareAndUpload, startHousehold } from './share-tests-shared';

const OPERATED_AT = new Date('2026-10-06T10:00:00Z');
const SHARED_AMOUNT = 7_654_321;
const PRIVATE_AMOUNT = 3_141_592;
const PRIVATE_STRINGS = ['Savings', 'secret-plan', 'private memo', 'UA-PRIVATE-IBAN', `${PRIVATE_AMOUNT}`, 'Top up savings'];

const seedSharedToPrivateTransfer = Effect.gen(function* () {
    const seed = new TestSeedService(testDb);
    const joint = yield* seed.account({ title: 'Joint' });
    const savings = yield* seed.account({ title: 'Savings' });
    const secretTag = yield* seed.tag('secret-plan');
    const transfer = yield* seed.directTransfer({
        exchangeRate: 1,
        operatedAt: OPERATED_AT,
        sourceAccountId: joint.id,
        sourceAmount: SHARED_AMOUNT,
        sourceEntryExchangeRate: 1,
        targetAccountId: savings.id,
        targetAmount: PRIVATE_AMOUNT,
        toIban: 'UA-PRIVATE-IBAN',
        title: 'Top up savings'
    });

    yield* testDb.$client.unsafe(`UPDATE transactions SET comment = 'private memo' WHERE id = ?`, [transfer.id]);
    yield* seed.transactionTag(transfer.id, secretTag.id);
    yield* seed.manualExpense({ accountId: savings.id, amount: 400_000, operatedAt: OPERATED_AT, title: 'Savings fee' });
    yield* refreshAllBalances(testDb);

    return { joint, savings, transfer };
});

const startSharedTransfer = (memberRole: SyncZoneRoleEnum) =>
    Effect.gen(function* () {
        const { deviceB, clouds } = yield* startHousehold(memberRole);
        const { joint } = yield* seedSharedToPrivateTransfer;

        yield* uploadDevice(testDb, clouds);
        yield* shareAndUpload(testDb, clouds, joint.id);

        return { deviceB, clouds };
    });

describe('cloud-sync/share-split-transfer', () => {
    shareDevices('two devices', it => {
        it.effect('never sends the private leg of a shared-to-private transfer to the member', () =>
            Effect.gen(function* () {
                const { deviceB, clouds } = yield* startSharedTransfer(SyncZoneRoleEnum.PARTICIPANT);

                expectNoRejections(yield* pullHousehold(deviceB, clouds, 'member-device'));
                expect(yield* queryRows(deviceB, `SELECT title, sync_zone FROM accounts`)).toEqual([
                    { title: 'Joint', sync_zone: HOUSEHOLD_ZONE }
                ]);
                expect(yield* countRows(deviceB, `transactions`)).toBe(1);
                expect(yield* queryRows(deviceB, `SELECT amount FROM transaction_entries`)).toEqual([{ amount: SHARED_AMOUNT }]);
                expect(yield* countRows(deviceB, `tags`)).toBe(0);
                expect(yield* countRows(deviceB, `sync_pending`)).toBe(0);

                const stored = yield* queryRows<{ readonly payload: string }>(deviceB, `SELECT payload FROM sync_record`);
                const everythingStored = stored.map(({ payload }) => payload).join('\n');

                for (const privateString of PRIVATE_STRINGS) {
                    expect(everythingStored).not.toContain(privateString);
                }

                expect(
                    yield* countRows(
                        deviceB,
                        `sync_record WHERE record_type = 'TransactionLeg' AND json_extract(payload, '$.encryptedFields.privateOwnerName') = 'Alice'`
                    )
                ).toBe(1);

                yield* testDb.$client.unsafe(`UPDATE transactions SET comment = 'edited private memo' WHERE comment = 'private memo'`);
                yield* uploadDevice(testDb, clouds);

                const afterPrivateEdit = yield* pullHousehold(deviceB, clouds, 'member-device');

                expect(afterPrivateEdit.flatMap(result => Object.keys(result.touched))).toEqual([]);
                expect(
                    yield* countRows(
                        testDb,
                        `transaction_entries e INNER JOIN accounts a ON a.id = e.account_id WHERE e.sync_zone <> a.sync_zone`
                    )
                ).toBe(0);
                yield* expectLedgers(deviceB, testDb);
            })
        );

        it.effect('joins the shared leg back into the whole transfer on the owner second device', () =>
            Effect.gen(function* () {
                const { deviceB, clouds } = yield* startSharedTransfer(SyncZoneRoleEnum.OWNER);

                expectNoRejections(yield* pullHousehold(deviceB, clouds, 'owner-b'));
                expect(yield* countRows(deviceB, `transactions WHERE sync_zone = '${HOUSEHOLD_ZONE}'`)).toBe(1);

                expectNoRejections(yield* pullZones(deviceB, clouds.personal, 'owner-b', [PERSONAL_ZONE], { order: 'reverse' }));
                expect(yield* countRows(deviceB, `transactions WHERE title = 'Top up savings'`)).toBe(1);
                expect(yield* countRows(deviceB, `transactions WHERE sync_zone = '${HOUSEHOLD_ZONE}'`)).toBe(0);
                expect(
                    yield* queryRows(
                        deviceB,
                        `SELECT e.sync_zone AS zone, e.amount AS amount FROM transaction_entries e INNER JOIN transactions t ON t.id = e.transaction_id WHERE t.title = 'Top up savings' ORDER BY e.amount`
                    )
                ).toEqual([
                    { zone: PERSONAL_ZONE, amount: PRIVATE_AMOUNT },
                    { zone: HOUSEHOLD_ZONE, amount: SHARED_AMOUNT }
                ]);
                yield* expectLedgers(deviceB, testDb);
            })
        );
    });
});
