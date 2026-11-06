const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function setup(get) {
  let auth='account-a'; const badges=[];
  const context={Notifications:{setBadgeCountAsync:async n=>badges.push(n)},axios:{get},Platform:{OS:'ios'},API_BASE_URL:'https://test',getAuthToken:async()=>auth};
  const source=fs.readFileSync(__dirname+'/../src/services/notificationService.js','utf8').replace(/^import .*;\n/gm,'').replace(/export const /g,'const ');
  vm.runInNewContext(source+'\nthis.sync=syncNotificationBadge;',context);
  return {sync:context.sync,badges,auth:v=>auth=v};
}
test('sets absolute server count, including clearing at zero',async()=>{
  let count=12;const s=setup(async()=>({data:{data:{unreadCount:count}}}));
  await s.sync();count=0;await s.sync();assert.deepEqual(s.badges,[12,0]);
});
test('network failures and invalid counts preserve badge',async()=>{
  const s=setup(async()=>{throw Error('offline')});await s.sync();assert.deepEqual(s.badges,[]);
  const bad=setup(async()=>({data:{data:{unreadCount:-1}}}));await bad.sync();assert.deepEqual(bad.badges,[]);
});
test('stale response cannot overwrite new account badge',async()=>{
  let resolve;const s=setup(()=>new Promise(r=>resolve=r));const pending=s.sync();
  await new Promise(r=>setImmediate(r));s.auth('account-b');resolve({data:{data:{unreadCount:99}}});await pending;assert.deepEqual(s.badges,[]);
});
test('logged out clears badge without fetching',async()=>{
  const s=setup(async()=>assert.fail('no request'));s.auth(null);await s.sync();assert.deepEqual(s.badges,[0]);
});
