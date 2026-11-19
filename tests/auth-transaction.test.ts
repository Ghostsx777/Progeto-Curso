import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
test('Auth writes metadata after INSERT: validate final row, consume once and roll back invalid signup',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
   create table auth.users(id uuid primary key,email text,raw_app_meta_data jsonb default '{}',raw_user_meta_data jsonb default '{}');
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   grant usage on schema public,auth to anon,authenticated,service_role;grant execute on function auth.uid() to public;`);
  const folder=new URL('../supabase/migrations/',import.meta.url);
  for(const f of readdirSync(folder).filter(f=>f.endsWith('.sql')).sort())await db.exec(readFileSync(new URL(f,folder),'utf8').replace('create extension if not exists pgcrypto;',''));
  const owner='10000000-0000-0000-0000-000000000001',student='10000000-0000-0000-0000-000000000002';
  await db.exec('begin');
  await db.query('insert into auth.users(id,email) values($1,$2)',[owner,'owner@example.invalid']);
  await db.query('update auth.users set raw_app_meta_data=$1 where id=$2',[JSON.stringify({bootstrap_owner:true}),owner]);
  await db.exec('commit');
  assert.equal((await db.query<{role:string}>('select role from public.profiles where id=$1',[owner])).rows[0].role,'admin');
  await db.query("insert into public.invites(token_hash,created_by,expires_at) values($1,$2,now()+interval '1 hour')",['a'.repeat(64),owner]);
  await db.exec('begin');
  await db.query('insert into auth.users(id,email) values($1,$2)',[student,'student@example.invalid']);
  await db.query('update auth.users set raw_app_meta_data=$1 where id=$2',[JSON.stringify({invite_hash:'a'.repeat(64)}),student]);
  await db.exec('commit');
  assert.equal((await db.query<{used_by:string}>('select used_by from public.invites')).rows[0].used_by,student);
  for(const metadata of [{invite_hash:'a'.repeat(64)},{}]){
   await db.exec('begin');
   await db.query("insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data) values(gen_random_uuid(),'invalid@example.invalid',$1,$2)",[JSON.stringify(metadata),JSON.stringify({bootstrap_owner:true})]);
   await assert.rejects(db.exec('commit'),/Invalid invitation/);await db.exec('rollback');
  }
  assert.equal((await db.query<{n:number}>('select count(*)::int as n from auth.users')).rows[0].n,2);
 }finally{await db.close();}
});
