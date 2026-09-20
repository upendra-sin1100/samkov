// Execute the actual PostgreSQL schema and transaction functions without cloud credentials.
const {PGlite}=require('@electric-sql/pglite');
const fs=require('fs');
const assert=require('node:assert/strict');
(async()=>{
 const db=new PGlite();
 try{
  await db.exec(fs.readFileSync('backend/schema.sql','utf8'));
  assert.equal((await db.query('SELECT count(*)::int AS n FROM tracks')).rows[0].n,8);
  const student=(await db.query("INSERT INTO profiles(auth_subject) VALUES ('user_student') RETURNING id")).rows[0].id;
  const other=(await db.query("INSERT INTO profiles(auth_subject) VALUES ('user_other') RETURNING id")).rows[0].id;
  const app=(await db.query("INSERT INTO applications(user_id,track_slug,student_name,college,motivation,start_date,status,end_date,authorized_signatory) VALUES ($1,'python','Test Student','College','A meaningful learning motivation',current_date,'approved',current_date+42,'Program Office') RETURNING id",[student])).rows[0].id;
  await assert.rejects(db.query("UPDATE tracks SET weeks=10 WHERE slug='python'"),/Curriculum/);
  await assert.rejects(db.query('SELECT complete_application($1)',[app]),/Every required/);
  async function submit(i,user=student){return db.query("INSERT INTO submissions(application_id,user_id,project_index,github_url,notes) VALUES ($1,$2,$3,'https://github.com/student/project','Tested original project with evidence')",[app,user,i])}
  await assert.rejects(submit(2),/Previous level/);
  await assert.rejects(submit(0,other),/Application not open/);
  for(let i=0;i<6;i++){
   await submit(i);
   await db.query("UPDATE submissions SET status='approved' WHERE application_id=$1 AND project_index=$2",[app,i]);
  }
  await assert.rejects(db.query("UPDATE submissions SET notes='tampered' WHERE application_id=$1 AND project_index=0",[app]),/immutable/);
  for (const mutation of ["live_url='https://example.com'", "linkedin_url='https://linkedin.com/in/other'", "status='rejected'", "project_index=20", "user_id='"+other+"'"]) {
   await assert.rejects(db.query(`UPDATE submissions SET ${mutation} WHERE application_id=$1 AND project_index=0`,[app]),/immutable|Application not open|Invalid project/);
  }
  await assert.rejects(db.query('SELECT * FROM issue_certificate($1)',[app]),/Completion not approved/);
  await db.query('SELECT complete_application($1)',[app]);
  const cert=(await db.query('SELECT * FROM issue_certificate($1)',[app])).rows[0];
  assert.match(cert.id,/^SKAI-\d{4}-[A-F0-9]{32}$/);
  assert.equal((await db.query('SELECT * FROM issue_certificate($1)',[app])).rows[0].id,cert.id);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM payments')).rows[0].n,0);
  await db.query("UPDATE certificates SET status='revoked' WHERE id=$1",[cert.id]);
  assert.equal((await db.query('SELECT * FROM issue_certificate($1)',[app])).rows[0].status,'revoked');
  await db.exec(fs.readFileSync('backend/migrations/001_free_access_analytics.sql','utf8'));
  await db.exec(fs.readFileSync('backend/migrations/001_free_access_analytics.sql','utf8'));
  await db.exec(fs.readFileSync('backend/migrations/002_review_integrity.sql','utf8'));
  await db.exec(fs.readFileSync('backend/migrations/002_review_integrity.sql','utf8'));
  assert.equal((await db.query('SELECT count(*)::int AS n FROM certificates')).rows[0].n,1);
  await assert.rejects(submit(0),/Application not open/);
  assert.ok((await db.query('SELECT count(*)::int AS n FROM audit_log')).rows[0].n>0);
  console.log('PASS: PostgreSQL schema, ownership, level gates, immutable evidence, completion, free issuance, repeatable migration, certificate idempotency, revocation, audit history.');
 }finally{await db.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
