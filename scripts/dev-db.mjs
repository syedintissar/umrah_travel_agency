/**
 * Local development database: a real PostgreSQL 17 server with no Docker or installer needed.
 * Data persists in `.local/postgres` (git-ignored). Matches DATABASE_URL in .env.example (port 5432).
 * Production uses managed PostgreSQL (AWS RDS); this is for development only.
 */
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import path from 'node:path';

const databaseDir = path.resolve(import.meta.dirname, '..', '.local', 'postgres');
const port = Number(process.env.DEV_DB_PORT ?? 5432);

const pg = new EmbeddedPostgres({
  databaseDir,
  user: 'umrah',
  password: 'umrah_dev_password',
  port,
  persistent: true,
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
});

if (!existsSync(path.join(databaseDir, 'PG_VERSION'))) {
  console.log('First run: creating the local database cluster...');
  await pg.initialise();
}
await pg.start();
try {
  await pg.createDatabase('umrah_travel');
} catch {
  // already exists
}
console.log(`\nPostgreSQL is ready on localhost:${port} (database: umrah_travel).`);
console.log('Keep this window open. Press Ctrl+C to stop it.\n');

let stopping = false;
const stop = async () => {
  if (stopping) return;
  stopping = true;
  console.log('\nStopping PostgreSQL...');
  await pg.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
setInterval(() => {}, 1 << 30);
