import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Client} from 'pg';

if(existsSync('.env.local'))process.loadEnvFile('.env.local');
const apply=process.argv.includes('--apply');
let client;
try{
 if(!process.env.SUPABASE_DB_URL)throw Object.assign(new Error(),{code:'MISSING_DB_URL'});
 const url=new URL(process.env.SUPABASE_DB_URL);
 const project=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
 const user=decodeURIComponent(url.username);
 const direct=url.hostname===`db.${project}.supabase.co`;
 const pooled=url.hostname.endsWith('.pooler.supabase.com')&&user===`postgres.${project}`;
 if(!['postgres:','postgresql:'].includes(url.protocol)||(!direct&&!pooled)||url.pathname!=='/postgres')throw Object.assign(new Error(),{code:'PROJECT_MISMATCH'});
 if(pooled&&url.port==='6543')throw Object.assign(new Error(),{code:'USE_SESSION_POOLER_5432'});
 client=new Client({host:url.hostname,port:Number(url.port||5432),database:'postgres',user,password:decodeURIComponent(url.password),ssl:{rejectUnauthorized:true,...(process.env.SUPABASE_DB_CA_FILE?{ca:readFileSync(process.env.SUPABASE_DB_CA_FILE,'utf8')}:{})},connectionTimeoutMillis:15000,query_timeout:120000,application_name:'devpath-migrations'});
 await client.connect();
 const tables=(await client.query("select tablename from pg_tables where schemaname='public' order by tablename")).rows.map(row=>row.tablename);
 const authCount=Number((await client.query('select count(*) as count from auth.users')).rows[0].count);
 const journalExists=(await client.query("select to_regclass('devpath_meta.migrations') is not null as present")).rows[0].present;
 const applied=journalExists?(await client.query('select version,checksum from devpath_meta.migrations order by version')).rows:[];
 const folder=new URL('../supabase/migrations/',import.meta.url);
 const migrations=readdirSync(folder).filter(file=>/^\d+.*\.sql$/.test(file)).sort().map(version=>{
   const sql=readFileSync(new URL(version,folder),'utf8');return {version,sql,checksum:createHash('sha256').update(sql).digest('hex')};
 });
 for(const entry of applied){if(!migrations.some(m=>m.version===entry.version&&m.checksum===entry.checksum))throw Object.assign(new Error(),{code:'MIGRATION_HISTORY_MISMATCH'});}
 const pending=migrations.filter(m=>!applied.some(a=>a.version===m.version));
 console.log(JSON.stringify({connected:true,project,publicTables:tables,authUserCount:authCount,recordedMigrations:applied.map(a=>a.version),pendingMigrations:pending.map(m=>m.version)},null,2));
 if(!apply){console.log('Inspeção somente leitura. Nenhuma migração aplicada.');}
 else{
   if(!journalExists&&(tables.length||authCount))throw Object.assign(new Error(),{code:'EXISTING_DATABASE_REQUIRES_REVIEW'});
   await client.query('begin');
   try{
     await client.query("set local lock_timeout='15s'");
     await client.query('select pg_advisory_xact_lock(619073)');
     await client.query('create schema if not exists devpath_meta');
     await client.query('revoke all on schema devpath_meta from public,anon,authenticated');
     await client.query('create table if not exists devpath_meta.migrations(version text primary key,checksum text not null,applied_at timestamptz not null default now())');
     for(const migration of pending){
       console.log(`Aplicando ${migration.version}`);
       await client.query(migration.sql);
       await client.query('insert into devpath_meta.migrations(version,checksum) values($1,$2)',[migration.version,migration.checksum]);
     }
     await client.query("notify pgrst, 'reload schema'");
     await client.query('commit');
     console.log(`COMMIT confirmado: ${pending.length} migrações aplicadas. Sem publicação do site.`);
   }catch(error){await client.query('rollback');throw error;}
 }
}catch(error){
 const allowed=['ENOTFOUND','EAI_AGAIN','ENETUNREACH','EHOSTUNREACH','ECONNREFUSED','ETIMEDOUT','DEPTH_ZERO_SELF_SIGNED_CERT','SELF_SIGNED_CERT_IN_CHAIN','UNABLE_TO_VERIFY_LEAF_SIGNATURE','CERT_HAS_EXPIRED','28P01','MISSING_DB_URL','PROJECT_MISMATCH','USE_SESSION_POOLER_5432','MIGRATION_HISTORY_MISMATCH','EXISTING_DATABASE_REQUIRES_REVIEW'];
 const code=String(error?.code||'CONNECTION_OR_MIGRATION_FAILED');
 console.error(JSON.stringify({ok:false,code:allowed.includes(code)||/^[0-9A-Z]{5}$/.test(code)?code:'CONNECTION_OR_MIGRATION_FAILED',detail:'A execução não foi confirmada. Credenciais e mensagens internas não foram exibidas.'}));process.exitCode=1;
}finally{if(client)await client.end().catch(()=>{});}
