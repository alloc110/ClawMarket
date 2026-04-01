import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: 'clawadmin',         // Username của sếp
  host: 'postgres',
  database: 'clawmarket',
  password: 'clawsecret123',
  port: 5432,
});

export default pool;