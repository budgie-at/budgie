import datetime
import sqlite3
import sys

database = sqlite3.connect(sys.argv[1])
account_type = sys.argv[2]
is_reconciliation = account_type == 'BANK_SYNC'
provider = 'MONOBANK' if is_reconciliation else 'BINANCE'
amount = 100_000_000 if is_reconciliation else 1_000_000
balance = 100_000_000 if is_reconciliation else 10_000_000
snapshot_at = int(datetime.datetime(2026, 10, 1, 12, tzinfo=datetime.timezone.utc).timestamp())
database.execute("INSERT INTO accounts(id,title,type,nature,instrument_id,icon,title_search,external_source,external_id) VALUES(9900,? ,?,'ASSET',1,'Wallet',?,?,?)", ('Fixture synced adjustment', account_type, 'fixture synced adjustment', provider, 'fixture-synced-adjustment'))
database.execute("INSERT INTO transactions(id,type,title,to_account_id,operated_at,exchange_rate) VALUES(9901,'ADJUSTMENT','Fixture sync adjustment',9900,?,1)", (snapshot_at - 1,))
database.execute("INSERT INTO transaction_entries(type,account_id,transaction_id,amount) VALUES('DEBIT',9900,9901,?)", (amount,))
database.execute("INSERT INTO account_balances(account_id,amount) VALUES(9900,?)", (balance,))
database.execute("INSERT INTO bank_syncs(account_id,provider,enabled,mode,forward_sync_from_at,reconciled_at,reconciled_balance,reconciliation_transaction_id) VALUES(9900,?,0,'FORWARD',?,?,?,?)", (provider, snapshot_at, snapshot_at if is_reconciliation else None, balance if is_reconciliation else None, 9901 if is_reconciliation else None))
database.commit()
database.close()
