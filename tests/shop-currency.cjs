const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs=require('node:fs'), vm=require('node:vm'), babel=require('@babel/core');
const en=JSON.parse(fs.readFileSync('src/i18n/locales/en-us.json','utf8'));
const pure={};vm.runInNewContext(fs.readFileSync('src/i18n/preferences.js','utf8').replace(/export /g,'')+'\nthis.f={formatUSD,formatCharge};',pure);
function harness(currency='CAD',{confirmed=true,expired=false,offline=false,stale=false}={}) {
 let si=0,ri=0,focus;const states=[],refs=[],effects=[],posts=[],gets=[],navigations=[];
 const amounts=currency==='JPY'?[3749,6749]:currency==='USD'?[2499,4499]:[3499,6299];
 const packages=[{id:'p1',coins:500,bonusCoins:100,priceInCents:2499},{id:'p2',coins:1000,bonusCoins:200,priceInCents:4499}].map((p,i)=>({...p,amount:amounts[i],currency,quoteToken:'signed-'+p.id,expiresAt:Date.now()+(expired?-1:600000)}));
 const market={country:currency==='JPY'?'JP':currency==='USD'?'US':'CA',currency,isConfirmed:confirmed};
 const copy=(text,vars={})=>text.replace(/{{(\w+)}}/g,(_,key)=>vars[key]??'');
 const t=(key,vars={})=>{let value=key.split('.').reduce((v,k)=>v?.[k],en)||key;return copy(value,vars);};
 const context={copy,useCopyUpdates(){},require:()=> 'logo',React:{createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity)})},useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return[states[i],v=>states[i]=typeof v==='function'?v(states[i]):v]},useRef:initial=>refs[ri++]||={current:initial},useEffect:f=>effects.push(f),useCallback:f=>f,useFocusEffect:f=>focus=f,useTranslation:()=>({t,i18n:{language:'en-us'}}),usePaymentConfig:()=>({mode:'live',publishableKey:'pk_test_fixture'}),useWallet:()=>({refresh(){}}),useAppAlert:()=>()=>{},getPaymentMarket:async()=>{if(offline)throw Error('offline');return market},countryName:country=>country,...pure.f,api:{get:async(path,options)=>{gets.push({path,options});return {data:{data:path.includes('packages')?{packages,market}:{coinBalance:13000}}}},post:async(...args)=>{posts.push(args);if(stale)throw {response:{status:409,data:{message:'Expired quote'}}};const p=packages.find(p=>p.id===args[1].packageId);return {data:{data:{clientSecret:'secret_fixture',paymentIntentId:'pi_fixture',amount:p.amount,currency:p.currency}}}}},StyleSheet:{create:x=>x},console:{warn(){},error(){}},setTimeout,setInterval:()=>1,clearInterval(){}};
 for(const name of ['View','Text','ScrollView','TouchableOpacity','ActivityIndicator','Image','ScreenWrapper','BackArrowIcon','Button','TreatCoinMark','StripeCardSheet'])context[name]=name;
 let source=fs.readFileSync('src/screens/financial/ShopCoinsScreen.js','utf8').replace(/^import[\s\S]*?from ['"][^'"]+['"];\n/gm,'').replace('export default function','function');
 source=babel.transformSync(source,{configFile:false,babelrc:false,plugins:['@babel/plugin-transform-react-jsx']}).code;
 vm.runInNewContext(source+'\nthis.Screen=ShopCoinsScreen;',context);
 const render=()=>{si=0;ri=0;return context.Screen({navigation:{goBack(){},navigate:(...args)=>navigations.push(args)}})};
 const nodes=n=>n&&typeof n==='object'?[n,...n.children.flatMap(nodes)]:[];
 const find=fn=>nodes(render()).find(fn);
 return{render,find,posts,gets,navigations,init:async()=>{render();for(const f of [...effects])f();focus();await new Promise(r=>setImmediate(r));}};
}
test('CAD shows and submits the signed local quote without any currency picker',async()=>{
 const h=harness();await h.init();assert.equal(h.find(n=>n.props.accessibilityRole==='radio'),undefined);
 const pay=h.find(n=>n.type==='Button'&&n.props.title==='Continue to Pay CAD 62.99');assert.ok(pay);assert.equal(pay.props.disabled,false);
 assert.equal(h.find(n=>n.type==='StripeCardSheet').props.amountLabel,'CAD 62.99');
 assert.equal(h.gets.find(x=>x.path.includes('packages')).options.params.localized,'1');
 await h.find(n=>n.type==='StripeCardSheet').props.fetchClientSecret();
 assert.equal(h.posts[0][1].packageId,'p2');assert.equal(h.posts[0][1].quoteToken,'signed-p2');assert.equal(h.posts[0][1].localized,true);assert.equal(h.posts[0][1].amount,undefined);
});
test('JPY formats whole yen and package changes update the exact card total',async()=>{
 const h=harness('JPY');await h.init();assert.equal(h.find(n=>n.type==='StripeCardSheet').props.amountLabel,'JPY 6,749');h.find(n=>n.type==='TouchableOpacity'&&n.props.key==='p1').props.onPress();assert.equal(h.find(n=>n.type==='StripeCardSheet').props.amountLabel,'JPY 3,749');
});
test('unconfirmed country requires confirmation and never loads payable packages',async()=>{
 const h=harness('CAD',{confirmed:false});await h.init();h.find(n=>n.type==='Button'&&n.props.title==='Confirm payment country').props.onPress();assert.equal(h.navigations[0][0],'PaymentCountry');assert.equal(h.gets.some(x=>x.path.includes('packages')),false);assert.equal(h.find(n=>n.type==='Button'&&n.props.title==='Select a package').props.disabled,true);
});
test('expired/offline quotes disable payment and stale purchases require price review',async()=>{
 const expired=harness('CAD',{expired:true});await expired.init();assert.equal(expired.find(n=>n.type==='Button'&&n.props.title==='Continue to Pay CAD 62.99').props.disabled,true);assert.ok(expired.find(n=>n.type==='Button'&&n.props.title==='Refresh prices'));
 const offline=harness('CAD',{offline:true});await offline.init();assert.equal(offline.find(n=>n.type==='Button'&&n.props.title==='Select a package').props.disabled,true);
 const stale=harness('CAD',{stale:true});await stale.init();await stale.find(n=>n.type==='StripeCardSheet').props.fetchClientSecret();assert.ok(stale.find(n=>n.type==='Button'&&n.props.title==='Refresh prices'));
});
