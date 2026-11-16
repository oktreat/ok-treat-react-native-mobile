const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const babel=require('@babel/core');

function load(path,mocks={}) {
  const code=babel.transformSync(fs.readFileSync(path,'utf8'),{configFile:false,babelrc:false,plugins:[['@babel/plugin-transform-react-jsx',{runtime:'automatic'}],'@babel/plugin-transform-modules-commonjs']}).code;
  const module={exports:{}};
  vm.runInNewContext(code,{module,exports:module.exports,require:name=>{if(name in mocks)return mocks[name];throw Error('Unexpected dependency: '+name)},URL,Set,console,setTimeout,clearTimeout,AbortController});
  return module.exports;
}
const links=load('src/utils/appStoreLinks.js');
test('iPhone updates never fall back to the Android store or arbitrary links',async()=>{
  for(const url of ['',undefined,links.PLAY_STORE_URL,'https://evil.example/','https://apps.apple.com/app/id999','https://apps.apple.com.evil.test/app/id6479255523'])assert.equal(links.appStoreLink('ios',url),links.APP_STORE_URL);
  const opened=[];await links.openAppStore({openURL:async url=>opened.push(url)},'ios','');assert.deepEqual(opened,[links.APP_STORE_URL]);
});
test('Android deep-link failure falls back to this app on Google Play',async()=>{
  const opened=[];await links.openAppStore({openURL:async url=>{opened.push(url);if(url.startsWith('market:'))throw Error('No market handler')}},'android','market://details?id=com.oktreat.app');
  assert.deepEqual(opened,['market://details?id=com.oktreat.app',links.PLAY_STORE_URL]);
  assert.equal(links.appStoreLink('android',links.APP_STORE_URL),links.PLAY_STORE_URL);
});
function updater(config,{platform='android',build='34',offline=false}={}) {
  return load('src/services/appVersionService.js',{'react-native':{Platform:{OS:platform}},'expo-application':{nativeBuildVersion:build},'../config/api':{get:async()=>{if(offline)throw Error('offline');return{data:{data:config}}}},'../utils/appStoreLinks':links});
}
test('auto mode supplies an optional update when the admin declares a newer build',async()=>{
  const r=await updater({mode:'auto',android:{latest:35}}).evaluateAppUpdate();assert.equal(r.action,'soft');assert.equal(r.storeUrl,links.PLAY_STORE_URL);
  assert.equal((await updater({mode:'auto',android:{latest:34}}).evaluateAppUpdate()).action,'auto');
});
test('offline, missing build and invalid thresholds never introduce a forced update',async()=>{
  assert.equal((await updater(null,{offline:true}).evaluateAppUpdate()).action,'none');
  for(const build of ['',null,'not-a-build'])assert.notEqual((await updater({mode:'auto',android:{latest:35}},{build}).evaluateAppUpdate()).action,'soft');
  assert.equal((await updater({mode:'auto',android:{latest:'invalid'}}).evaluateAppUpdate()).action,'auto');
});
test('existing explicit minimum-build policy is preserved with a correct iOS store fallback',async()=>{
  const result=await updater({mode:'force',ios:{minSupported:35}},{platform:'ios',build:'34.1'}).evaluateAppUpdate();
  assert.equal(result.action,'force');assert.equal(result.storeUrl,links.APP_STORE_URL);
});

function preferencesHarness() {
  let cursor=0;const hooks=[],effects=[],pending=[],alerts=[];
  const element=(type,props)=>({type,props:props||{}});
  const hooksApi={useState:initial=>{const i=cursor++;if(!(i in hooks))hooks[i]=initial;return[hooks[i],v=>{hooks[i]=typeof v==='function'?v(hooks[i]):v}]},useRef:initial=>{const i=cursor++;if(!(i in hooks))hooks[i]={current:initial};return hooks[i]},useEffect:(fn,deps)=>{const i=cursor++;if(!hooks[i]){hooks[i]=deps;effects.push(fn)}}};
  const rn={StyleSheet:{create:x=>x}};for(const name of ['View','Text','ScrollView','TouchableOpacity','Switch','ActivityIndicator'])rn[name]=name;
  const api={get:async()=>({data:{data:{preferences:{bookings:true,messages:true,reviews:true,payments:true,petAlerts:true,account:true,promotional:true}}}}),put:(path,body)=>new Promise((resolve,reject)=>pending.push({path,body,resolve,reject}))};
  const Screen=load('src/screens/notifications/NotificationPreferencesScreen.js',{
    react:hooksApi,'react/jsx-runtime':{jsx:element,jsxs:element},'react-i18next':{useTranslation:()=>({i18n:{language:'en'}})},'react-native':rn,
    '@expo/vector-icons/Ionicons':'Icon','../../components/ScreenWrapper':'ScreenWrapper','../../assets':{BackArrowIcon:'BackArrow'},'../../context/AlertContext':{useAppAlert:()=> (...args)=>alerts.push(args)},'../../config/api':api,'../../components/PushSoundDiagnostics':'Diagnostics','./notificationPreferencesCopy':{getNotificationPreferencesCopy:()=>s=>s}
  }).default;
  const render=()=>{cursor=0;const result=Screen({navigation:{goBack(){}}});while(effects.length)effects.shift()();return result};
  const walk=node=>!node||typeof node!=='object'?[]:[node,...[node.props?.children].flat(Infinity).flatMap(walk)];
  const toggle=(tree,label)=>walk(tree).find(n=>n.type==='Switch'&&n.props.accessibilityLabel===label);
  return{render,toggle,pending,alerts,flush:()=>new Promise(resolve=>setImmediate(resolve))};
}
test('out-of-order category saves preserve both choices and deduplicate a repeated tap',async()=>{
  const h=preferencesHarness();h.render();await h.flush();const t=h.render();
  const first=h.toggle(t,'Bookings').props.onValueChange();const duplicate=h.toggle(t,'Bookings').props.onValueChange();const second=h.toggle(t,'Messages').props.onValueChange();
  assert.equal(h.pending.length,2);
  h.pending[1].resolve({data:{success:true,data:{preferences:{bookings:false,messages:false}}}});await second;
  h.pending[0].resolve({data:{success:true,data:{preferences:{bookings:false,messages:true}}}});await first;await duplicate;
  const result=h.render();assert.equal(h.toggle(result,'Bookings').props.value,false);assert.equal(h.toggle(result,'Messages').props.value,false);
});
test('failed or malformed saves roll back only their category',async()=>{
  const h=preferencesHarness();h.render();await h.flush();const t=h.render();
  const first=h.toggle(t,'Bookings').props.onValueChange();const second=h.toggle(t,'Messages').props.onValueChange();
  h.pending[1].resolve({data:{success:true,data:{preferences:{messages:false}}}});await second;
  h.pending[0].resolve({data:{success:true,data:{}}});await first;
  const result=h.render();assert.equal(h.toggle(result,'Bookings').props.value,true);assert.equal(h.toggle(result,'Messages').props.value,false);assert.equal(h.alerts.length,1);
});
