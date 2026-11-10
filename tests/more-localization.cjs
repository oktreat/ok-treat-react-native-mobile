const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const ja = JSON.parse(fs.readFileSync('src/i18n/locales/copy-ja.json','utf8'));
const interpolate = (text, values={}) => (ja[text] || text).replace(/\{\{(\w+)\}\}/g,(_,key)=>String(values[key] ?? ''));
const paths = [
  'src/screens/main/MoreScreen.js','src/screens/profile/ProfileScreen.js','src/screens/profile/EditProfileDetailsScreen.js',
  'src/screens/settings/SettingsScreen.js','src/screens/settings/BlockedUsersScreen.js','src/screens/notifications/NotificationsScreen.js',
  'src/screens/financial/CashOutScreen.js','src/screens/financial/PaymentMethodsScreen.js','src/screens/financial/TransactionHistoryScreen.js',
  'src/screens/main/InviteFriendsScreen.js','src/screens/scans/ScansScreen.js','src/screens/scans/ScanMapDetailScreen.js',
  'src/screens/services/OpenRequestsScreen.js','src/screens/sitter/home/SitterProfileScreen.js','src/components/ImagePickerButton.js','src/utils/localizedDisplay.js','src/screens/profile/SupportScreen.js'
];
for (const lang of ['ja','fr','de','zh']) test('audited More screens cover fixed '+lang+' copy and preserve every interpolation token',()=>{
  const dictionary=JSON.parse(fs.readFileSync('src/i18n/locales/copy-'+lang+'.json','utf8'));
  const verify=key=>{assert.ok(dictionary[key], 'Missing '+lang+': '+key);assert.deepEqual((key.match(/\{\{\w+\}\}/g)||[]).sort(),(dictionary[key].match(/\{\{\w+\}\}/g)||[]).sort(),key);};
  for(const file of paths){const ast=parser.parse(fs.readFileSync(file,'utf8'),{sourceType:'module',plugins:['jsx']});traverse(ast,{
    CallExpression(p){if(p.node.callee.name==='copy'&&p.node.arguments[0]?.type==='StringLiteral')verify(p.node.arguments[0].value);},
    ObjectProperty(p){if(['title','label','description'].includes(p.node.key.name)&&p.node.value.type==='StringLiteral')verify(p.node.value.value);}
  });}
});
test('every notification category, explanation and error has translated copy in each non-English locale',()=>{
  const source=fs.readFileSync('src/screens/notifications/notificationPreferencesCopy.js','utf8').replace(/export /g,'');
  const c=vm.runInNewContext(source+'\n({notificationPreferenceTranslations,getNotificationPreferencesCopy})');
  const keys=Object.keys(c.notificationPreferenceTranslations.ja);
  for(const lang of ['ja','fr','de','zh'])for(const key of keys)assert.ok(c.notificationPreferenceTranslations[lang][key],lang+': '+key);
  assert.equal(c.getNotificationPreferencesCopy('ja-JP')('Messages'),'メッセージ');
  assert.equal(c.getNotificationPreferencesCopy('en-uk')('Messages'),'Messages');
});
function renderHarness(file,name,extra={}){
  let i=0,ri=0;const state=[],refs=[],effects=[];
  const context={React:{createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity).filter(x=>x!=null&&x!==false)}),Fragment:'Fragment'},
    useState: initial=>{const n=i++;if(!(n in state))state[n]=typeof initial==='function'?initial():initial;return [state[n],v=>state[n]=typeof v==='function'?v(state[n]):v];},
    useRef: initial=>refs[ri++]||={current:initial},useEffect:f=>effects.push(f),StyleSheet:{create:x=>x},...extra};
  for(const type of ['ScreenWrapper','View','Text','TouchableOpacity','ScrollView','Switch','ActivityIndicator','Icon','BackArrowIcon','PushSoundDiagnostics','Modal','Pressable'])context[type]=type;
  const src=fs.readFileSync(file,'utf8').replace(/^import[\s\S]*?from ['"][^'"]+['"];\n/gm,'').replace('export default function','function');
  const code=babel.transformSync(src,{configFile:false,babelrc:false,plugins:[['@babel/plugin-transform-react-jsx',{runtime:'classic'}]]}).code;
  vm.runInNewContext(code+'\nthis.Component='+name,context);
  const render=props=>{i=0;ri=0;return context.Component(props)};
  const nodes=t=>t&&typeof t==='object'?[t,...t.children.flatMap(nodes)]:[];
  const text=t=>t&&typeof t==='object'?t.children.map(text).join(' '):String(t??'');
  return {render,nodes,text,state,effects};
}
test('Japanese preference labels save the original backend keys and roll back on failure',async()=>{
  let language='ja',fail=false;const calls=[];
  const translationSource=fs.readFileSync('src/screens/notifications/notificationPreferencesCopy.js','utf8').replace(/export /g,'');
  const copyModule=vm.runInNewContext(translationSource+'\n({getNotificationPreferencesCopy})');
  const prefs={bookings:true,messages:true,reviews:true,payments:true,petAlerts:true,account:true,promotional:true};
  const h=renderHarness('src/screens/notifications/NotificationPreferencesScreen.js','NotificationPreferencesScreen',{
    useTranslation:()=>({i18n:{resolvedLanguage:language}}),getNotificationPreferencesCopy:copyModule.getNotificationPreferencesCopy,useAppAlert:()=>()=>{},
    api:{get:async()=>({data:{data:{preferences:{...prefs}}}}),put:async(path,payload)=>{calls.push([path,payload]);if(fail)throw Error('offline');Object.assign(prefs,payload);return {data:{data:{preferences:{...prefs}}}};}}
  });
  const props={navigation:{goBack(){}}};h.render(props);h.effects[0]();await new Promise(r=>setImmediate(r));
  let tree=h.render(props);assert.ok(h.text(tree).includes('通知設定'));assert.ok(h.text(tree).includes('メッセージ'));
  let toggle=h.nodes(tree).find(n=>n.type==='Switch'&&n.props.accessibilityLabel==='メッセージ');
  await toggle.props.onValueChange();assert.equal(calls[0][0],'/notifications/preferences');assert.deepEqual(JSON.parse(JSON.stringify(calls[0][1])),{messages:false});
  assert.equal(h.nodes(h.render(props)).find(n=>n.props.accessibilityLabel==='メッセージ').props.value,false);
  fail=true;toggle=h.nodes(h.render(props)).find(n=>n.props.accessibilityLabel==='メッセージ');await toggle.props.onValueChange();
  assert.equal(h.nodes(h.render(props)).find(n=>n.props.accessibilityLabel==='メッセージ').props.value,false);
  language='fr';assert.ok(h.text(h.render(props)).includes('Préférences de notification'));assert.equal(prefs.messages,false);
});
for(const lang of ['ja','fr','de','zh']) test(lang+' dropdown labels retain raw gender and transaction-filter values',()=>{
  const dict=JSON.parse(fs.readFileSync('src/i18n/locales/copy-'+lang+'.json'));
  const translate=key=>dict[key]||key;
  const selected=[];function Value(v){this.current=v}
  const h=renderHarness('src/components/Dropdown.js','Dropdown',{
    screenHeight:844,Dimensions:{get:()=>({height:844})},Animated:{Value,spring:()=>({start(){}}),timing:()=>({start:f=>f?.()}),View:'AnimatedView'}
  });
  const props={value:'Male',placeholder:'性別',options:['Male','Female','Other'],formatLabel:translate,onSelect:x=>selected.push(x)};
  let tree=h.render(props);assert.ok(h.text(tree).includes(translate('Male')));assert.ok(h.text(tree).includes(translate('Female')));
  h.nodes(tree).find(n=>n.type==='TouchableOpacity'&&h.text(n)===translate('Female')).props.onPress();assert.equal(selected[0],'Female');
  tree=h.render({...props,value:'This Month',options:['This Month','This Week']});
  assert.ok(h.text(tree).includes(translate('This Month')));h.nodes(tree).find(n=>n.type==='TouchableOpacity'&&h.text(n)===translate('This Week')).props.onPress();assert.equal(selected[1],'This Week');
});
test('Japanese relative dates preserve counts and never translate member names or codes',()=>{
  const context={i18n:{language:'ja'},copy:interpolate,Date};
  const source=fs.readFileSync('src/utils/localizedDisplay.js','utf8').replace(/^import .*;\n/gm,'').replace(/export /g,'');
  vm.runInNewContext(source+'\nthis.f={relativeTime,displayLocale};',context);
  const now=Date.parse('2026-11-10T12:00:00Z');
  assert.equal(context.f.relativeTime('2026-11-10T11:30:00Z',now),'30分前');
  assert.equal(context.f.relativeTime('2026-11-09T12:00:00Z',now),'昨日');
  assert.equal(context.f.displayLocale(),'ja');
  assert.ok(interpolate('Use my referral code {{code}}.',{code:'9WN18S5F'}).includes('9WN18S5F'));
  assert.ok(interpolate('{{name}} Scanned',{name:'Toto <pet>'}).includes('Toto <pet>'));
});

test('each More display enum is translated without changing its stored value',()=>{
  const keys=['Male','Female','Other','This Week','This Month','Last 3 Months','Last 6 Months','This Year','Earning','Pending Earnings','Withdrawals','Payments','PURCHASE','EARN','SPEND','REFUND','HOLD','ADJUST','BONUS','CASHOUT','CASHOUT_FEE','COMPLETED','PENDING','CONFIRMED','PROCESSING','FAILED','REJECTED','APPROVED','Booking','TreatCoins / payment','Account','App problem','Safety concern','Open','Resolved'];
  for(const lang of ['ja','fr','de','zh']) {
    const dict=JSON.parse(fs.readFileSync('src/i18n/locales/copy-'+lang+'.json'));
    for(const key of keys)assert.ok(dict[key],lang+': '+key);
  }
});
test('Chinese copy namespace is registered alongside existing Chinese resources',()=>{
  const source=fs.readFileSync('src/i18n/index.js','utf8');
  assert.match(source,/import copyZh from '.\/locales\/copy-zh.json'/);
  assert.match(source,/zh: \{ translation: zh, copy: copyZh \}/);
});
