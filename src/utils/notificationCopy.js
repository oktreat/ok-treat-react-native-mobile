// Translate only known system templates. Captures are inserted literally, never
// recursively translated: member names, places, reasons and notes stay intact.
const languages = ['ja', 'fr', 'de', 'zh'];
const rows = [
 ['New Booking Request','新しい予約リクエスト','Nouvelle demande de réservation','Neue Buchungsanfrage','新的预订请求'],
 ['Booking Confirmed','予約が確定しました','Réservation confirmée','Buchung bestätigt','预订已确认'],
 ['Booking Declined','予約リクエストが辞退されました','Réservation refusée','Buchung abgelehnt','预订请求已被拒绝'],
 ['Booking Cancelled','予約がキャンセルされました','Réservation annulée','Buchung storniert','预订已取消'],
 ['Booking Completed','予約が完了しました','Réservation terminée','Buchung abgeschlossen','预订已完成'],
 ['Booking completed','予約が完了しました','Réservation terminée','Buchung abgeschlossen','预订已完成'],
 ['Booking request expired','予約リクエストの期限が切れました','Demande de réservation expirée','Buchungsanfrage abgelaufen','预订请求已过期'],
 ['Confirm your booking','予約の完了を確認してください','Confirmez votre réservation','Buchung bestätigen','请确认预订完成'],
 ['New Message','新しいメッセージ','Nouveau message','Neue Nachricht','新消息'],
 ['New Review','新しいレビュー','Nouvelle évaluation','Neue Bewertung','新评价'],
 ['Coins added to your wallet','ウォレットにTreatCoinsが追加されました','TreatCoins ajoutés au portefeuille','TreatCoins zum Wallet hinzugefügt','TreatCoins已添加到钱包'],
 ['Coins refunded','TreatCoinsが返還されました','TreatCoins remboursés','TreatCoins erstattet','TreatCoins已退回'],
 ['You earned coins!','TreatCoinsを獲得しました！','Vous avez gagné des TreatCoins !','Du hast TreatCoins verdient!','您获得了TreatCoins！'],
 ['You earned referral coins! 🎉','紹介特典のTreatCoinsを獲得しました！🎉','Vous avez gagné des TreatCoins de parrainage ! 🎉','Du hast Empfehlungs-TreatCoins verdient! 🎉','您获得了推荐奖励TreatCoins！🎉'],
 ['QR tag linked','QRタグが連携されました','Tag QR associé','QR-Tag verknüpft','QR标签已绑定'],
 ['QR tag disconnected','QRタグの連携が解除されました','Tag QR dissocié','QR-Tag getrennt','QR标签已解除绑定'],
 ['Missing pet near you','近くでペットが迷子になっています','Animal perdu près de vous','Vermisstes Tier in deiner Nähe','您附近有宠物走失'],
 ["You're an approved sitter! 🎉",'シッターとして承認されました！🎉','Votre profil de gardien est approuvé ! 🎉','Du bist als Sitter zugelassen! 🎉','您的照护者申请已获批准！🎉'],
 ['Sitter application not approved','シッター申請は承認されませんでした','Candidature de gardien non approuvée','Sitter-Bewerbung nicht genehmigt','照护者申请未获批准'],
 ['Welcome to OkTreat! 🐾','OkTreatへようこそ！🐾','Bienvenue sur OkTreat ! 🐾','Willkommen bei OkTreat! 🐾','欢迎使用OkTreat！🐾'],
 ['Password changed','パスワードが変更されました','Mot de passe modifié','Passwort geändert','密码已更改'],
 ['Withdrawal approved ✅','出金が承認されました ✅','Retrait approuvé ✅','Auszahlung genehmigt ✅','提现已批准 ✅'],
 ['Withdrawal not approved','出金は承認されませんでした','Retrait non approuvé','Auszahlung nicht genehmigt','提现未获批准'],
 ['OkTreat Support replied','OkTreatサポートから返信が届きました','Le support OkTreat a répondu','OkTreat Support hat geantwortet','OkTreat客服已回复'],
 ['OkTreat Care — new request','OkTreat Care — 新しい問い合わせ','OkTreat Care — nouvelle demande','OkTreat Care — neue Anfrage','OkTreat Care — 新请求'],
 ['OkTreat Care — customer reply','OkTreat Care — お客様からの返信','OkTreat Care — réponse du client','OkTreat Care — Kundenantwort','OkTreat Care — 客户回复'],
 ['Your booking has been confirmed by the sitter','シッターが予約を承認しました','Le gardien a confirmé votre réservation','Der Sitter hat deine Buchung bestätigt','照护者已确认您的预订'],
 ['Your booking request has been declined by the sitter','シッターが予約リクエストを辞退しました','Le gardien a refusé votre demande de réservation','Der Sitter hat deine Buchungsanfrage abgelehnt','照护者已拒绝您的预订请求'],
 ['Your booking request expired because the sitter did not respond in time.','シッターから期限内に返信がなかったため、予約リクエストの期限が切れました。','Votre demande a expiré car le gardien n’a pas répondu à temps.','Deine Buchungsanfrage ist abgelaufen, weil der Sitter nicht rechtzeitig geantwortet hat.','照护者未及时回复，您的预订请求已过期。'],
 ['A booking has been cancelled','予約がキャンセルされました','Une réservation a été annulée','Eine Buchung wurde storniert','一项预订已被取消'],
 ['Your booking has been marked as completed. You can now leave a review!','予約が完了になりました。レビューを投稿できます！','Votre réservation est terminée. Vous pouvez laisser une évaluation !','Deine Buchung ist abgeschlossen. Du kannst jetzt eine Bewertung abgeben!','您的预订已标记为完成，现在可以发表评价！'],
 ['Your booking was automatically marked complete. You can now leave a review!','予約が自動的に完了になりました。レビューを投稿できます！','Votre réservation a été automatiquement terminée. Vous pouvez laisser une évaluation !','Deine Buchung wurde automatisch abgeschlossen. Du kannst jetzt eine Bewertung abgeben!','您的预订已自动标记为完成，现在可以发表评价！'],
 ['Your sitter marked this booking complete. Please confirm so they can be paid, or the system will auto-confirm in 3 days.','シッターが予約を完了にしました。支払いのために確認してください。確認されない場合、3日後に自動で確認されます。','Votre gardien a terminé la prestation. Confirmez pour permettre son paiement ; sinon, le système confirmera dans 3 jours.','Dein Sitter hat die Buchung als abgeschlossen markiert. Bitte bestätige die Leistung zur Auszahlung. Sonst erfolgt die Bestätigung automatisch nach 3 Tagen.','照护者已标记预订完成。请确认以便付款，否则系统将在3天后自动确认。'],
 ['Your sitter application was approved. You can now receive booking requests.','シッター申請が承認されました。予約リクエストを受け取れるようになりました。','Votre candidature est approuvée. Vous pouvez recevoir des demandes de réservation.','Deine Sitter-Bewerbung wurde genehmigt. Du kannst jetzt Buchungsanfragen erhalten.','您的照护者申请已获批准，现在可以接收预订请求。'],
 ["We couldn't approve your sitter application at this time. Reach out to support for next steps.",'今回はシッター申請を承認できませんでした。今後の手順についてサポートにお問い合わせください。','Nous n’avons pas pu approuver votre candidature. Contactez le support pour la suite.','Deine Sitter-Bewerbung konnte derzeit nicht genehmigt werden. Wende dich für weitere Schritte an den Support.','您的照护者申请暂未获批准。请联系客服了解后续步骤。'],
 ['Your account is verified. Add your first pet to get started.','アカウントの確認が完了しました。最初のペットを追加して始めましょう。','Votre compte est vérifié. Ajoutez votre premier animal pour commencer.','Dein Konto ist bestätigt. Füge dein erstes Tier hinzu, um loszulegen.','您的账户已验证。添加您的第一只宠物即可开始。'],
 ["Your password was changed successfully. If this wasn't you, contact support immediately.",'パスワードが変更されました。心当たりがない場合は、すぐにサポートへご連絡ください。','Votre mot de passe a été modifié. Si vous n’êtes pas à l’origine de cette modification, contactez immédiatement le support.','Dein Passwort wurde geändert. Falls du das nicht warst, kontaktiere sofort den Support.','您的密码已更改。如非本人操作，请立即联系客服。'],
 ['Your withdrawal was approved. Open Cash Out to receive your payout.','出金が承認されました。「出金」を開いて受け取ってください。','Votre retrait est approuvé. Ouvrez Retrait pour recevoir votre paiement.','Deine Auszahlung wurde genehmigt. Öffne Auszahlen, um sie zu erhalten.','您的提现已批准。打开提现页面领取款项。'],
 ['Your coins have been returned.','TreatCoinsが返還されました。','Vos TreatCoins ont été remboursés.','Deine TreatCoins wurden zurückerstattet.','您的TreatCoins已退回。'],
 ['You have a new reply to your support request.','お問い合わせに新しい返信が届きました。','Vous avez une nouvelle réponse à votre demande d’assistance.','Du hast eine neue Antwort auf deine Supportanfrage.','您的客服请求有新回复。'],
 ['Customer support needs your attention. Open OkTreat Care.','対応が必要な問い合わせがあります。OkTreat Careを開いてください。','Une demande d’assistance nécessite votre attention. Ouvrez OkTreat Care.','Eine Supportanfrage erfordert deine Aufmerksamkeit. Öffne OkTreat Care.','有客服请求需要您处理。请打开OkTreat Care。'],
 ['Someone scanned the tag. Open the scan to see details.','誰かがタグをスキャンしました。スキャン履歴を開いて詳細を確認してください。','Quelqu’un a scanné le tag. Ouvrez le scan pour voir les détails.','Jemand hat den Tag gescannt. Öffne den Scan für Details.','有人扫描了标签。打开扫描记录查看详情。'],
];
// {1}, {2}, etc. represent literal captures from an anchored system template.
const templates = [
 ['BOOKING_REQUEST', /^You have a new (.+) booking request$/, '新しい{1}の予約リクエストがあります','Vous avez une nouvelle demande de réservation : {1}','Du hast eine neue Buchungsanfrage für {1}','您有新的{1}预订请求'],
 ['MESSAGE', /^You have a new message from (.+)$/, '{1}から新しいメッセージが届きました','Vous avez un nouveau message de {1}','Du hast eine neue Nachricht von {1}','您收到来自{1}的新消息'],
 ['REVIEW', /^You received a ([0-9.]+)-star review$/, '星{1}のレビューが届きました','Vous avez reçu une évaluation de {1} étoiles','Du hast eine Bewertung mit {1} Sternen erhalten','您收到一条{1}星评价'],
 ['COINS_PURCHASED', /^([\d,.]+) coins are now in your wallet\.$/, 'ウォレットに{1} TreatCoinsが追加されました。','{1} TreatCoins ont été ajoutés à votre portefeuille.','{1} TreatCoins wurden deinem Wallet hinzugefügt.','{1} TreatCoins已添加到您的钱包。'],
 ['COINS_REFUNDED', /^([\d,.]+) coins have been refunded to your wallet\.$/, 'ウォレットに{1} TreatCoinsが返還されました。','{1} TreatCoins ont été remboursés dans votre portefeuille.','{1} TreatCoins wurden deinem Wallet erstattet.','{1} TreatCoins已退回您的钱包。'],
 ['COINS_EARNED', /^([\d,.]+) coins were credited to your earnings\. Cashable in 30 days\.$/, '{1} TreatCoinsが収益に加算されました。30日後に出金できます。','{1} TreatCoins ont été ajoutés à vos gains. Retrait possible dans 30 jours.','{1} TreatCoins wurden deinen Einnahmen gutgeschrieben. In 30 Tagen auszahlbar.','您的收入已增加{1} TreatCoins，30天后可提现。'],
 ['REFERRAL_REWARD', /^(.+) used your code — ([\d,.]+) coins added to your balance\.$/, '{1}が紹介コードを使用しました。残高に{2} TreatCoinsが追加されました。','{1} a utilisé votre code : {2} TreatCoins ajoutés à votre solde.','{1} hat deinen Code verwendet — {2} TreatCoins wurden deinem Guthaben hinzugefügt.','{1}使用了您的推荐码，余额已增加{2} TreatCoins。'],
 ['PET_QR_LINKED', /^(.+)'s QR tag is now active\. If they're ever lost, anyone scanning the tag will see your contact info\.$/, '{1}のQRタグが有効になりました。迷子になった際、タグをスキャンした人に連絡先が表示されます。','Le tag QR de {1} est actif. En cas de disparition, toute personne qui le scanne pourra voir vos coordonnées.','Der QR-Tag von {1} ist aktiv. Falls dein Tier vermisst wird, sehen Finder beim Scannen deine Kontaktdaten.','{1}的QR标签已启用。如宠物走失，扫描标签的人将能看到您的联系方式。'],
 ['PET_QR_DISCONNECTED', /^(.+)'s QR tag has been disconnected by an administrator\.(?: Reason: (.+))?$/, '管理者が{1}のQRタグの連携を解除しました。{2}','Un administrateur a dissocié le tag QR de {1}. {2}','Ein Administrator hat den QR-Tag von {1} getrennt. {2}','管理员已解除{1}的QR标签绑定。{2}'],
 ['PET_SCANNED_WHILE_MISSING', /^(.+)'s tag was just scanned$/, '{1}のタグがスキャンされました','Le tag de {1} vient d’être scanné','Der Tag von {1} wurde gerade gescannt','{1}的标签刚刚被扫描'],
 ['PET_SCANNED_WHILE_MISSING', /^Someone scanned the tag near (.+)\. Open the scan to see details\.$/, '{1}付近でタグがスキャンされました。スキャン履歴を開いて詳細を確認してください。','Quelqu’un a scanné le tag près de {1}. Ouvrez le scan pour voir les détails.','Jemand hat den Tag bei {1} gescannt. Öffne den Scan für Details.','有人在{1}附近扫描了标签。打开扫描记录查看详情。'],
 ['NEARBY_MISSING_PET', /^(.+) is missing — last seen near (.+) \(~([\d.]+) km from you\)\. Tap to help\.$/, '{1}が迷子です。最後に目撃された場所は{2}付近（約{3} km先）です。タップして協力してください。','{1} a disparu, vu pour la dernière fois près de {2} (à environ {3} km). Touchez pour aider.','{1} wird vermisst — zuletzt bei {2} gesehen (etwa {3} km entfernt). Tippe, um zu helfen.','{1}走失，最后出现在{2}附近（距您约{3}公里）。点击提供帮助。'],
 ['SITTER_REJECTED', /^We couldn't approve your sitter application\. Reason: (.+)$/, 'シッター申請は承認されませんでした。理由：{1}','Nous n’avons pas pu approuver votre candidature. Motif : {1}','Deine Sitter-Bewerbung konnte nicht genehmigt werden. Grund: {1}','您的照护者申请未获批准。原因：{1}'],
 ['WITHDRAWAL_REJECTED', /^Reason: (.+)\. Your coins have been returned\.$/, '理由：{1}。TreatCoinsが返還されました。','Motif : {1}. Vos TreatCoins ont été remboursés.','Grund: {1}. Deine TreatCoins wurden zurückerstattet.','原因：{1}。您的TreatCoins已退回。'],
 ['PET_SIGHTING_REPORTED', /^Possible sighting of (.+)$/, '{1}が目撃された可能性があります','{1} a peut-être été aperçu','{1} wurde möglicherweise gesichtet','可能有人目击到{1}'],
];
const services = {
 boarding: ['お泊まり','garde avec hébergement','Tierpension','寄养'],
 'house sitting': ['自宅でのペットシッター','garde à domicile','Haussitting','上门留宿照护'],
 'drop in visits': ['訪問ケア','visites à domicile','Hausbesuche','上门探访'],
 'day care': ['日中預かり','garde de jour','Tagesbetreuung','日托'],
 'pet walking': ['ペットのお散歩','promenade','Gassi-Service','宠物散步'],
 'dog walking': ['犬のお散歩','promenade de chien','Gassi-Service','遛狗'],
};
function normalizeLanguage(language) {
  const code = String(language || '').toLowerCase().trim().split(/[-_,;]/)[0];
  return languages.includes(code) ? code : 'en';
}
function translate(text, type, language, title = false) {
  const index = languages.indexOf(normalizeLanguage(language));
  if (index < 0 || typeof text !== 'string') return text;
  const row = rows.find(row => row[0] === text);
  // Chat contents and unknown system notices must not be rewritten just
  // because their text happens to match a known title or sentence.
  if (row && type !== 'SYSTEM' && (type !== 'MESSAGE' || title)) return row[index + 1];
  for (const [event, pattern, ...translations] of templates) {
    if (event !== type) continue;
    const match = text.match(pattern);
    if (!match) continue;
    const values = match.slice(1);
    if (type === 'BOOKING_REQUEST' && services[values[0]]) values[0] = services[values[0]][index];
    return translations[index].replace(/\{([1-9])\}/g, (_, n) => values[Number(n) - 1] || '').trim();
  }
  return text;
}
function localizeNotification(notification, language) {
  const result = {...notification, title: translate(notification.title, notification.type, language, true),
    message: translate(notification.message, notification.type, language)};
  const index = languages.indexOf(normalizeLanguage(language)), data = notification.data || {};
  if (index >= 0 && notification.type === 'PET_SIGHTING_REPORTED' && data.finderName && data.petName) {
    const location = Number.isFinite(data.latitude) && Number.isFinite(data.longitude)
      ? `${data.latitude.toFixed(3)}, ${data.longitude.toFixed(3)}` : '';
    const where = location ? ` near ${location}` : '';
    const note = data.note ? ` "${data.note}"` : '';
    if (notification.message === `${data.finderName} may have spotted ${data.petName}${where}.${note} Tap to view.`) {
      const patterns = ['{1}が{2}を目撃した可能性があります。{3}{4} タップして確認してください。','{1} a peut-être aperçu {2}. {3}{4} Touchez pour voir.','{1} hat möglicherweise {2} gesichtet. {3}{4} Tippe für Details.','{1}可能目击到{2}。{3}{4} 点击查看。'];
      const values = [data.finderName, data.petName, location, note];
      result.message = patterns[index].replace(/\{([1-4])\}/g, (_, n) => values[Number(n)-1]);
    }
  }
  return result;
}
module.exports = {normalizeLanguage, localizeNotification};
