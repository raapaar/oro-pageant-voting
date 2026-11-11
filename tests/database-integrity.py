"""Runs the actual migration against SQLite to check ballot integrity and ownership."""
import concurrent.futures, pathlib, sqlite3, tempfile, uuid
migration='\n'.join(p.read_text() for p in sorted(pathlib.Path('drizzle').glob('*.sql')))
with tempfile.TemporaryDirectory() as tmp:
    path=tmp+'/votes.db'
    with sqlite3.connect(path) as db: db.executescript(migration)
    def cast(_):
        with sqlite3.connect(path,timeout=10) as db:
            return db.execute('INSERT INTO practice_votes VALUES (?,?,?,?,?) ON CONFLICT DO NOTHING RETURNING id',(str(uuid.uuid4()),'draft:owner:1','voter','contestant-01','2026-11-09')).fetchone()
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool: results=list(pool.map(cast,range(8)))
    assert sum(bool(r) for r in results)==1,results
    with sqlite3.connect(path) as db:
        assert db.execute('SELECT COUNT(*) FROM practice_votes').fetchone()[0]==1
        db.execute('INSERT INTO practice_votes VALUES (?,?,?,?,?)',(str(uuid.uuid4()),'draft:owner:2','voter','contestant-02','2026-11-09'))
        assert db.execute('SELECT COUNT(*) FROM practice_votes WHERE event_key=?',('draft:owner:2',)).fetchone()[0]==1
        db.execute('INSERT INTO event_drafts VALUES (?,?,?)',('owner-a','{"title":"a"}',1))
        db.execute('INSERT INTO event_drafts VALUES (?,?,?)',('owner-b','{"title":"b"}',1))
        assert db.execute('SELECT payload FROM event_drafts WHERE owner_id=?',('owner-a',)).fetchone()[0]=='{"title":"a"}'
print('PASS: actual D1 migration, eight concurrent ballot inserts → one vote, separate draft revisions and owner-keyed drafts.')
