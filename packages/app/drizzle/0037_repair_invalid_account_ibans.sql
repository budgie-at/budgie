UPDATE accounts
SET iban = 'UA00PRIVATBANK' || substr(iban, 10)
WHERE iban IS NOT NULL
  AND length(iban) = 13
  AND substr(iban, 1, 9) = 'UA1111111';
--> statement-breakpoint
UPDATE accounts
SET iban = NULL
WHERE iban IS NOT NULL
  AND (
    length(iban) < 15
    OR length(iban) > 34
    OR iban NOT GLOB '[A-Z][A-Z][0-9][0-9]*'
    OR iban GLOB '*[^A-Z0-9]*'
  );
--> statement-breakpoint
UPDATE accounts SET icon = 'AlarmClock' WHERE icon = 'Alarm';
--> statement-breakpoint
UPDATE accounts SET icon = 'AlarmClockCheck' WHERE icon = 'AlarmCheck';
--> statement-breakpoint
UPDATE accounts SET icon = 'AlarmClockMinus' WHERE icon = 'AlarmMinus';
--> statement-breakpoint
UPDATE accounts SET icon = 'AlarmClockOff' WHERE icon = 'AlarmOff';
--> statement-breakpoint
UPDATE accounts SET icon = 'AlarmClockPlus' WHERE icon = 'AlarmPlus';
