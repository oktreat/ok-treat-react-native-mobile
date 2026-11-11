const {test} = require('node:test');
const assert = require('node:assert/strict');
const {normalizeLanguage, localizeNotification} = require('../src/utils/notificationCopy');
test('supported device language tags normalize and unsupported locales fall back safely', () => {
  for (const [tag, expected] of [['ja-JP','ja'],['fr-CA','fr'],['de-DE','de'],['zh-Hans-CN','zh'],['en-GB','en'],['es','en'],[null,'en']]) assert.equal(normalizeLanguage(tag), expected);
});
test('system notifications translate in all four languages with identifiers and read state intact', () => {
  const examples = [
    ['BOOKING_REQUEST','New Booking Request','You have a new boarding booking request'],
    ['BOOKING_CONFIRMED','Booking Confirmed','Your booking has been confirmed by the sitter'],
    ['BOOKING_DECLINED','Booking request expired','Your booking request expired because the sitter did not respond in time.'],
    ['BOOKING_COMPLETED','Confirm your booking','Your sitter marked this booking complete. Please confirm so they can be paid, or the system will auto-confirm in 3 days.'],
    ['MESSAGE','New Message','You have a new message from Patrick $& {1}'],
    ['COINS_REFUNDED','Coins refunded','1,250 coins have been refunded to your wallet.'],
    ['COINS_PURCHASED','Coins added to your wallet','1,250 coins are now in your wallet.'],
    ['COINS_EARNED','You earned coins!','1,250 coins were credited to your earnings. Cashable in 30 days.'],
    ['REVIEW','New Review','You received a 5-star review'],
    ['PET_QR_LINKED','QR tag linked',"Toto's QR tag is now active. If they're ever lost, anyone scanning the tag will see your contact info."],
    ['PET_QR_DISCONNECTED','QR tag disconnected',"Toto's QR tag has been disconnected by an administrator. Reason: user asked"],
    ['PET_SCANNED_WHILE_MISSING',"Toto's tag was just scanned",'Someone scanned the tag near Kyoto, Japan. Open the scan to see details.'],
    ['NEARBY_MISSING_PET','Missing pet near you','Toto is missing — last seen near Kyoto, Japan (~2.5 km from you). Tap to help.'],
    ['REFERRAL_REWARD','You earned referral coins! 🎉','Patrick used your code — 100 coins added to your balance.'],
    ['SUPPORT_REPLY','OkTreat Support replied','You have a new reply to your support request.'],
    ['PHONE_VERIFIED','Welcome to OkTreat! 🐾','Your account is verified. Add your first pet to get started.'],
    ['SITTER_APPROVED',"You're an approved sitter! 🎉",'Your sitter application was approved. You can now receive booking requests.'],
    ['SITTER_REJECTED','Sitter application not approved',"We couldn't approve your sitter application. Reason: please update document"],
    ['PASSWORD_RESET_SUCCESSFUL','Password changed',"Your password was changed successfully. If this wasn't you, contact support immediately."],
    ['WITHDRAWAL_REJECTED','Withdrawal not approved','Reason: please update document. Your coins have been returned.'],
  ];
  for (const language of ['ja','fr','de','zh']) for (const [type,title,message] of examples) {
    const input={id:'notification-1',type,title,message,isRead:false,data:{bookingId:'booking-1'}};
    const output=localizeNotification(input,language);
    assert.notEqual(output.title,title,`${language} ${type} title`);
    assert.notEqual(output.message,message,`${language} ${type} message`);
    assert.equal(output.data,input.data);assert.equal(output.type,type);assert.equal(output.isRead,false);
    assert.equal(input.message,message);
  }
});
test('names, member messages and unknown announcements are preserved literally', () => {
  const message='You have a new message from Patrick $& {1}';
  assert.ok(localizeNotification({type:'MESSAGE',message},'ja').message.includes('Patrick $& {1}'));
  for(const message of ['Booking Confirmed','私の犬です','Meet me at Coffee Club']) assert.equal(localizeNotification({type:'MESSAGE',message},'fr').message,message);
  assert.equal(localizeNotification({type:'SYSTEM',title:'New Message',message:'A custom announcement'},'de').message,'A custom announcement');
  const n={type:'BOOKING_CONFIRMED',title:'Booking Confirmed',message:'Your booking has been confirmed by the sitter'};
  assert.deepEqual(localizeNotification(n,'en-US'),n);
});
test('sighting details translate while finder note, pet name and coordinates remain intact', () => {
  const n={type:'PET_SIGHTING_REPORTED',title:'Possible sighting of Toto',message:'Patrick may have spotted Toto near 35.000, 135.000. "By the café $&" Tap to view.',data:{finderName:'Patrick',petName:'Toto',latitude:35,longitude:135,note:'By the café $&'}};
  for(const lang of ['ja','fr','de','zh']) {
    const out=localizeNotification(n,lang);assert.notEqual(out.message,n.message);
    for(const value of ['Patrick','Toto','35.000, 135.000','By the café $&'])assert.ok(out.message.includes(value));
  }
});
