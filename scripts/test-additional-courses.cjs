const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { PGlite } = require('@electric-sql/pglite');
const loaded = {exports:{}};
new Function('module', 'exports', ts.transpileModule(fs.readFileSync('frontend/app/additional-courses.js', 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(loaded, loaded.exports);
const {additionalCourses} = loaded.exports;
(async () => {
 const db = new PGlite();
 try {
  // Simulate upgrading a populated installation, then repeat the migration.
  const schema = fs.readFileSync('backend/schema.sql', 'utf8');
  await db.exec(schema.split('-- Add courses without changing')[0]);
  const student = (await db.query("INSERT INTO profiles(auth_subject) VALUES ('user_courses') RETURNING id")).rows[0].id;
  await db.query("INSERT INTO applications(user_id,track_slug,student_name,college,motivation,start_date) VALUES ($1,'python','Existing Learner','College','Learn Python',current_date)",[student]);
  const before = (await db.query("SELECT * FROM tracks WHERE slug='python'")).rows[0];
  const migration = fs.readFileSync('backend/migrations/006_additional_courses.sql', 'utf8');
  await db.exec(migration);
  await db.exec(migration);
  assert.deepEqual((await db.query("SELECT * FROM tracks WHERE slug='python'")).rows[0],before);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM applications')).rows[0].n,1);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM tracks')).rows[0].n,14);
  for (const course of additionalCourses) {
   const track = (await db.query('SELECT * FROM tracks WHERE slug=$1',[course.slug])).rows[0];
   assert.equal(track.title,course.name);
   assert.equal(track.weeks,course.weeks);
   assert.equal(track.project_count,course.tasks.length);
   assert.deepEqual(track.content.projects,course.tasks.map(([title])=>title));
   assert.equal(course.tasks.length,6);
   assert.ok(course.tasks.every(([title,brief])=>title && brief.length>60));
   assert.ok(course.resources.every(r=>new URL(r.url).protocol==='https:'));
   const app = (await db.query("INSERT INTO applications(user_id,track_slug,student_name,college,motivation,start_date,end_date,status,authorized_signatory) VALUES ($1,$2,'Course Learner','College','Build practical skills',current_date,current_date+$3::int,'approved','Program Office') RETURNING id",[student,course.slug,course.weeks*7])).rows[0].id;
   const submit=i=>db.query("INSERT INTO submissions(application_id,user_id,project_index,github_url,notes) VALUES ($1,$2,$3,'https://example.org/project','Original project with reproducible validation evidence')",[app,student,i]);
   await assert.rejects(db.query('SELECT * FROM issue_certificate($1)',[app]),/Completion not approved/);
   await assert.rejects(submit(2),/Previous level/);
   await assert.rejects(submit(6),/Invalid project/);
   for(let i=0;i<6;i++) {
    await submit(i);
    await assert.rejects(db.query('SELECT complete_application($1)',[app]),/Every required/);
    await db.query("UPDATE submissions SET status='approved' WHERE application_id=$1 AND project_index=$2",[app,i]);
   }
   await assert.rejects(db.query('SELECT * FROM issue_certificate($1)',[app]),/Completion not approved/);
   await db.query('SELECT complete_application($1)',[app]);
   const cert = (await db.query('SELECT * FROM issue_certificate($1)',[app])).rows[0];
   assert.equal(cert.track_title,course.name);
   assert.equal(cert.duration_weeks,course.weeks);
   assert.equal(cert.projects_completed,6);
   assert.equal(cert.user_id,student);
   assert.equal(cert.application_id,app);
   assert.match(cert.id,/^SKAI-\d{4}-[A-F0-9]{32}$/);
   assert.equal((await db.query('SELECT * FROM issue_certificate($1)',[app])).rows[0].id,cert.id);
   await db.query("UPDATE certificates SET status='revoked' WHERE id=$1",[cert.id]);
   assert.equal((await db.query('SELECT * FROM issue_certificate($1)',[app])).rows[0].status,'revoked');
  }
  console.log('PASS: all six courses, repeatable upgrade, preserved enrollment, project gates, completion approval, certificate metadata, duplicate claims and revocation.');
 } finally {await db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
