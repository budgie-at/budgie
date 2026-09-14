set -u
cd "$(dirname "$0")/.."
scenes=$(python3 -c "
import json
c=json.load(open('.github/landing-media.config.json'))
print(' '.join(s['name'] for s in c['capture-scenes']))
")
for s in $scenes; do
  out=.scratch/s.db
  SCENE=$s LOCALE=en APPEARANCE=dark bash tests/app-tests/scripts/seed-screenshot-scene.sh --dry-run --output "$PWD/$out" >/dev/null 2>&1 || { echo "SEEDFAIL $s"; continue; }
  cp "$out" .scratch/s2.db
  for f in packages/app/drizzle/0046_*.sql packages/app/drizzle/0047_*.sql packages/app/drizzle/0048_*.sql packages/app/drizzle/0049_*.sql packages/app/drizzle/0050_*.sql packages/app/drizzle/0051_*.sql packages/app/drizzle/0052_*.sql; do
    sqlite3 .scratch/s2.db < "$f" 2>/dev/null || echo "MIGFAIL $s $f"
  done
  a=$(sqlite3 "$out" "select group_concat(id||':'||amount||':'||base_amount) from (select * from debt_events order by id)")
  b=$(sqlite3 .scratch/s2.db "select group_concat(id||':'||amount||':'||base_amount) from (select * from debt_events order by id)")
  c=$(sqlite3 "$out" "select group_concat(account_id||':'||amount) from (select * from account_balances order by account_id)")
  d=$(sqlite3 .scratch/s2.db "select group_concat(account_id||':'||amount) from (select * from account_balances order by account_id)")
  e=$(sqlite3 "$out" "select group_concat(id||':'||coalesce(original_transaction_id,'-')) from (select * from transaction_entries order by id)")
  g=$(sqlite3 .scratch/s2.db "select group_concat(id||':'||coalesce(original_transaction_id,'-')) from (select * from transaction_entries order by id)")
  [ "$a" != "$b" ] && echo "DIFF-debt_events $s"
  [ "$c" != "$d" ] && echo "DIFF-balances $s: $c  =>  $d"
  [ "$e" != "$g" ] && echo "DIFF-entries $s"
done
echo SWEEPDONE
