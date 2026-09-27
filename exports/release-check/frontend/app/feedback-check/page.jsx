'use client';
import ProgramFeedback, {FeedbackInbox} from '../program-feedback';
const record={id:'test-feedback',application_id:'test-application',rating:1,message:'Needs better examples.'};
let saved=false;
async function api(action,body){
 if(action==='my_feedback')return {feedback:saved?[record]:[]};
 if(action==='send_feedback'){if(body.message.includes('abusive'))throw Error('Please remove abusive language.');saved=true;return {ok:true};}
 if(action==='list_feedback')return {feedback:[record]};
 return {ok:true};
}
export default function Page(){return <main style={{padding:24}}><ProgramFeedback applicationId="test-application" api={api}/><FeedbackInbox api={api}/></main>}
