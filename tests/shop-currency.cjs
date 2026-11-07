const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs=require('node:fs'), vm=require('node:vm'), babel=require('@babel/core');
const en=JSON.parse(fs.readFileSync('src/i18n/locales/en-us.json','utf8'));
function harness(saved='CAD') {
 let si=0,ri=0;const states=[],refs=[],effects=[],posts=[],writes=[];
 const t=(key,vars={})=>{let value=key.split('.').reduce((v,k)=>v?.[k],en)||key;return value.replace(/{{(\w+)}}/g,(_,k)=>vars[k]??'');};
 const context={copy:(text,values={})=>text.replace(/{{(\w+)}}/g,(_,k)=>values[k]??''),useCopyUpdates(){},require:()=> 'logo',React:{createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity)})},useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return[states[i],v=>states[i]=typeof v==='function'?v(states[i]):v]},useRef:initial=>refs[ri++]||={current:initial},useEffect:f=>effects.push(f),useCallback:f=>f,useTranslation:()=>({t}),usePaymentConfig:()=>({mode:'live',publishableKey:'pk_test_fixture'}),useWallet:()=>({refresh(){}}),useAppAlert:()=>()=>{},AsyncStorage:{getItem:async()=>saved,setItem:async(k,v)=>writes.push([k,v])},Localization:{getLocales:()=>[{regionCode:'CA'}]},CURRENCIES:['USD','CAD','JPY'],resolveCurrency:s=>s==='system'?'CAD':s,formatUSD:c=>`US$${(Number(c||0)/100).toFixed(2)}`,api:{get:async path=>({data:{data:path.includes('packages')?{packages:[{id:'p1',coins:500,bonusCoins:100,priceInCents:2499},{id:'p2',coins:1000,bonusCoins:200,priceInCents:4499}]}:{coinBalance:13000}}}),post:async(...args)=>{posts.push(args);return {data:{data:{clientSecret:'secret_fixture',paymentIntentId:'pi_fixture'}}}}},StyleSheet:{create:x=>x},console,setTimeout};
 for(const name of ['View','Text','ScrollView','TouchableOpacity','ActivityIndicator','Image','ScreenWrapper','BackArrowIcon','Button','TreatCoinMark','StripeCardSheet'])context[name]=name;
 let source=fs.readFileSync('src/screens/financial/ShopCoinsScreen.js','utf8').replace(/^import[\s\S]*?from ['"][^'"]+['"];\n/gm,'').replace('export default function','function');
 source=babel.transformSync(source,{configFile:false,babelrc:false,plugins:['@babel/plugin-transform-react-jsx']}).code;
 vm.runInNewContext(source+'\nthis.Screen=ShopCoinsScreen;',context);
 const render=()=>{si=0;ri=0;return context.Screen({navigation:{goBack(){}}})};
 const nodes=n=>n&&typeof n==='object'?[n,...n.children.flatMap(nodes)]:[];
 const find=fn=>nodes(render()).find(fn);
 return{render,find,posts,writes,init:async()=>{render();for(const f of [...effects])f();await new Promise(r=>setImmediate(r));}};
}
test('purchase page has no currency picker and keeps the same USD amount through confirmation',async()=>{
 const h=harness();await h.init();
 assert.equal(h.find(n=>n.props.accessibilityRole==='radio'),undefined);
 assert.ok(h.find(n=>n.type==='Text'&&n.children.includes('All payments are currently charged in USD.')));
 const pay=h.find(n=>n.type==='Button');assert.equal(pay.props.title,'Continue to Pay US$44.99');assert.equal(pay.props.disabled,false);
 assert.equal(h.find(n=>n.type==='StripeCardSheet').props.amountLabel,'US$44.99');
 await h.find(n=>n.type==='StripeCardSheet').props.fetchClientSecret();
 assert.equal(h.posts.length,1);assert.equal(h.posts[0][0],'/coins/purchase');assert.equal(h.posts[0][1].packageId,'p2');assert.equal(Object.keys(h.posts[0][1]).length,1);
});
test('changing package changes the exact USD total shown at confirmation',async()=>{
 const h=harness('USD');await h.init();h.find(n=>n.type==='TouchableOpacity'&&n.props.key==='p1').props.onPress();
 assert.equal(h.find(n=>n.type==='Button').props.title,'Continue to Pay US$24.99');
 assert.equal(h.find(n=>n.type==='StripeCardSheet').props.amountLabel,'US$24.99');
});
