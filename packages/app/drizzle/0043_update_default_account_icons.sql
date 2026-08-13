UPDATE accounts SET icon='PiggyBank' WHERE type='CASH' AND icon='Wallet';
--> statement-breakpoint
UPDATE accounts SET icon='PiggyBank' WHERE type='SAVINGS' AND icon='Coins';
--> statement-breakpoint
UPDATE accounts SET icon='Landmark' WHERE type='DEPOSIT' AND icon='PiggyBank';
