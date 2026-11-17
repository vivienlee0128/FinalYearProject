const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const ts=require('typescript');
function load(relative,env={},deps={},fetcher=async()=>{throw new Error('No network call expected')}){
 const name=path.join(__dirname,'..',relative);
 const source=ts.transpileModule(fs.readFileSync(name,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};
 const sandbox={module,exports:module.exports,require:(n)=>{if(n in deps)return deps[n];throw new Error('Unexpected require: '+n)},process:{env},Date,Error,JSON,Number,String,Array,Math,Promise,RegExp,Boolean,encodeURIComponent,fetch:fetcher,AbortController};
 vm.runInNewContext(source,sandbox,{filename:name});return module.exports;
}
test('Demo mode is explicitly fictional and student-owned',async()=>{
 const api=load('src/services/studentAttendance.ts',{EXPO_PUBLIC_STUDENT_DEMO_MODE:'true'},{'./semesterAttendanceV2API':{getSemesterAttendanceV2:async()=>{throw Error('No external demo endpoint configured')}}});
 const data=await api.loadOwnAttendance('900000001','development',async()=>{throw Error('Should not request a token')});
 assert.equal(data.source,'synthetic');assert.equal(data.studentSisId,'900000001');assert.equal(data.semesters.length,2);
 assert.ok(data.semesters[0].units.every(u=>u.source==='synthetic'));
});
test('Unconfigured mode fails closed',async()=>{
 const api=load('src/services/studentAttendance.ts',{}, {'./semesterAttendanceV2API':{}});
 await assert.rejects(()=>api.loadOwnAttendance('900000001','microsoft',async()=>''),/not configured/);
});
test('Live API requires real Microsoft login',async()=>{
 const api=load('src/services/studentAttendance.ts',{EXPO_PUBLIC_STUDENT_ATTENDANCE_API_URL:'https://n8n.example/attendance'},{'./semesterAttendanceV2API':{}});
 await assert.rejects(()=>api.loadOwnAttendance('900000001','development',async()=>''),/Microsoft authentication/);
});
test('Live attendance does not send SIS query and rejects another student',async()=>{
 let request=null;
 const api=load('src/services/studentAttendance.ts',{EXPO_PUBLIC_STUDENT_ATTENDANCE_API_URL:'https://n8n.example/attendance'},{'./semesterAttendanceV2API':{}},async(url,opts)=>{
  request={url,opts};return {ok:true,json:async()=>({success:true,studentSisId:'900000002',source:'qwickly',semesters:[]})};
 });
 await assert.rejects(()=>api.loadOwnAttendance('900000001','microsoft',async()=> 'access-token'),/does not match/);
 assert.equal(request.url,'https://n8n.example/attendance');
 assert.equal(request.opts.headers.Authorization,'Bearer access-token');
});
test('Live check-in sends QR only and cannot fabricate a success',async()=>{
 let sent=null;
 const api=load('src/services/studentCheckIn.ts',{EXPO_PUBLIC_STUDENT_CHECKIN_API_URL:'https://n8n.example/checkin'},{'./qrAttendanceAPI':{},'./studentAttendance':{studentAttendanceMode:()=> 'live'}},async(url,opts)=>{
  sent={url,opts};return {ok:true,json:async()=>({ok:true,recordedInQwickly:false,message:'demo only'})};
 });
 const result=await api.studentCheckIn('QR_CONTENT','900000001','microsoft',async()=> 'access-token');
 assert.equal(result.ok,false);assert.deepEqual(JSON.parse(sent.opts.body),{qrData:'QR_CONTENT'});
});
test('Demo QR requires real student sign-in even when preview is enabled',async()=>{
 const api=load('src/services/studentCheckIn.ts',{}, {'./qrAttendanceAPI':{submitDemoQrAttendance:async()=>{throw Error('not expected')}},'./studentAttendance':{studentAttendanceMode:()=> 'demo'}});
 await assert.rejects(()=>api.studentCheckIn('QR_CONTENT','900000001','development',async()=>''),/Expo Go preview cannot check in/);
});
test('Student routes only in app/_layout and logo retained',()=>{
 const layout=fs.readFileSync(path.join(__dirname,'..','src/app/_layout.tsx'),'utf8');
 for(const name of ['home','attendance','scan','profile']) assert.ok(layout.includes(`name="${name}"`));
 for(const name of ['cases','audit','students','reports']) assert.ok(!layout.includes(`name="${name}"`));
 const app=JSON.parse(fs.readFileSync(path.join(__dirname,'..','app.json')));
 assert.equal(app.expo.scheme,'mynewapp');assert.ok(app.expo.android.permissions.includes('CAMERA'));
 assert.ok(fs.existsSync(path.join(__dirname,'..','assets/branding/swinburne-logo.png')));
});
