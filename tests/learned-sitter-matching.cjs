const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const context={};vm.runInNewContext(fs.readFileSync('src/services/sitterMatching.js','utf8').replace(/export function/g,'function')+'\nthis.rank=rankSitters',context);const rank=context.rank;
const sitter=(id,extra={})=>({id,approvalStatus:'APPROVED',availableForBooking:true,distance:3,rating:4.5,reviews:5,yearsOfExperience:3,pets:['Dog'],services:{BOARDING:{petPreferences:['Dog'],petSizePreference:['Large']}},...extra});
const ctx={pet:{type:'Dog',weight:30,ageYears:4},serviceType:'BOARDING',rotationKey:'stable'};
const learned=adjustment=>({version:'booking-feedback-bayes-v1',source:'your-completed-booking-reviews',adjustment});
test('learned outcomes change the score and expose an honest reason',()=>{
 const a=sitter('a');const base=rank([a],ctx)[0];const positive=rank([a],{...ctx,feedbackBySitter:{a:learned(.03)}})[0];const negative=rank([a],{...ctx,feedbackBySitter:{a:learned(-.04)}})[0];assert.ok(positive.matchScore>base.matchScore);assert.ok(negative.matchScore<base.matchScore);assert.ok(positive.matchReasons.includes('Based on your completed-booking reviews'));
});
test('feedback cannot lift incompatible or unapproved sitters above eligible ones',()=>{
 const good=sitter('good');const bad=sitter('bad',{approvalStatus:'PENDING',rating:5,reviews:100});const wrong=sitter('wrong',{services:{BOARDING:{petPreferences:['Cat'],petSizePreference:['Small']}}});
 for(let i=0;i<100;i++)assert.equal(rank([bad,wrong,good],{...ctx,rotationKey:String(i),feedbackBySitter:{bad:learned(999),wrong:learned(999)}})[0].id,'good');
});
test('invalid or unavailable models leave the ordinary score unchanged',()=>{
 const a=sitter('a');const base=rank([a],ctx)[0].matchScore;
 for(const model of [undefined,{},learned(NaN),learned('0.04'),{...learned(.04),version:'unknown'}])assert.equal(rank([a],{...ctx,feedbackBySitter:{a:model}})[0].matchScore,base);
});
test('equally suitable sitters still receive exposure with learning enabled',()=>{
 const first=new Set();for(let i=0;i<100;i++)first.add(rank([sitter('a'),sitter('b')],{...ctx,rotationKey:String(i),feedbackBySitter:{a:learned(.01)}})[0].id);assert.equal(first.size,2);
});
