const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={};vm.runInNewContext(fs.readFileSync('src/utils/otpInput.js','utf8').replace(/export /g,'')+';this.f={applyOtpInput,completeOtp,receivedOtpLength,PREFERRED_OTP_LENGTH};',ctx);const f=ctx.f;
test('six digits are required; invalid characters cannot complete a code',()=>{
 assert.equal(f.PREFERRED_OTP_LENGTH,6);assert.equal(f.completeOtp(['1','2','3','4']),false);assert.equal(f.completeOtp(['0','1','2','3','4','5']),true);assert.equal(f.completeOtp(['1','2','3','4','5','x']),false);assert.equal(f.applyOtpInput([],'abc',0),null);
});
test('paste and SMS autofill fill all six boxes, including a leading zero',()=>{
 const result=f.applyOtpInput(['9','','','','',''],'012345',3);assert.equal(result.digits.join(''),'012345');assert.equal(result.focus,5);assert.equal(f.completeOtp(result.digits),true);
 const erased=f.applyOtpInput(result.digits,'',5);assert.equal(f.completeOtp(erased.digits),false);
});
test('backend length metadata keeps old servers and old challenges usable',()=>{
 assert.equal(f.receivedOtpLength({data:{codeLength:6}}),6);assert.equal(f.receivedOtpLength({codeLength:6}),6);assert.equal(f.receivedOtpLength({}),4);assert.equal(f.receivedOtpLength({codeLength:4}),4);assert.equal(f.completeOtp(['1','2','3','4'],4),true);
});
