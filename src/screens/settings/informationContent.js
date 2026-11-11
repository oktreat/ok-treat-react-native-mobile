// Fixed information copy only. Account settings and verification rules are unchanged.
const en = {
  back: 'Back', support: 'Help & Support', fullTerms: 'Read the full existing Terms (English)', closeTerms: 'Close full Terms',
  updated: 'Information updated 10 November 2026',
  privacyChoices: { title: 'Privacy Choices', intro: 'Choose what you share and where you appear.', sections: [
    ['Your profile', 'Edit your account details in Settings → Account settings. In PALS → Profile, turn off Show my profile to stop appearing in discovery. Hiding a profile does not delete earlier conversations.'],
    ['Device permissions', 'Manage location, camera, photos and notifications in your phone’s settings for OkTreat. Disabling a permission can limit related features. A Smart Tag finder can view the public pet profile without sharing their location.'],
    ['Public pet details', 'Review the contact and pet information shown on your Smart Tag profile before sharing the tag. Anyone with the tag link can see its public information.'],
    ['Your data', 'Use Settings → Delete Account to request account deletion, or ask the support team about access, correction or deletion. Some records may need to be retained for operational or legal obligations.'],
    ['Identity checks', 'Read Stripe’s notice and choices before starting a live identity check. PALS gallery photos are separate from the verification selfie and are not currently face-matched.']
  ]},
  privacyPolicy: { title: 'Privacy Policy', intro: 'How information is used in the OkTreat app and its connected services.', sections: [
    ['Information used', 'Account and service features process the information you provide: name, email, phone, address, profile and pet details, photos, bookings, messages, reviews, payment and TreatCoins activity. PALS also uses introductions, interests, languages, destinations, dates, invitations and conversations. Support messages are linked to your account.'],
    ['Location and visibility', 'Supplied or permitted location supports nearby care searches and lost-pet features. Public Smart Tag details are visible to anyone opening the tag link. PALS visibility controls determine whether other members can discover your profile.'],
    ['Why we use information', 'We use information to operate accounts, care searches, bookings, messaging, payments and support, send enabled notifications, protect the service and investigate misuse or technical problems. Sitter recommendations use completed-booking ratings; private care notes and review text are not sent to an external AI service by that matching model. Recommendations do not guarantee suitability.'],
    ['Payments and identity', 'Stripe handles relevant payments and live identity checks. Stripe Identity collects ID images, verification selfies and extracted identity details, and uses biometric comparison of the selfie and ID. OkTreat receives results and can access information made available in its Stripe account; biometric identifiers are not shared with OkTreat. Gallery photos are not matched to the selfie. Stripe may collect device and interaction data for fraud prevention and service analytics. Read Stripe’s notices and choices in the relevant flow.'],
    ['Providers and storage', 'Connected application records are processed by the OkTreat service on DigitalOcean and relevant service providers. Earlier support requests may remain with the previous provider. Information may be processed outside your country. Retention depends on the record, service needs and applicable obligations. We do not sell your personal information.'],
    ['Choices and contact', 'You can edit available profile settings and manage device permissions. Contact careteam@oktreat.com through support about access, correction, deletion or retention. We may verify your identity before acting. Some records may need to be retained for legitimate operational or legal reasons. We may update this notice as the service changes.']
  ]},
  terms: { title: 'Terms of Service', intro: 'This short guide explains key service points. It does not replace the full existing Terms, available below in English. No new agreement is being requested on this screen.', sections: [
    ['Your account and care', 'Keep your account secure and provide accurate information. Discuss your pet’s needs and agree care arrangements before booking. A profile, identity check or conversation does not guarantee suitability or safety.'],
    ['TreatCoins', 'TreatCoins are internal pet-care credits, separate from ALOHA. Review current purchase, booking, hold, cancellation, completion and cash-out rules in the relevant transaction. Purchased TreatCoins cannot be cashed out.'],
    ['Community and availability', 'Do not impersonate, harass, misuse personal information or interfere with the service. PALS is for adults meeting travel friends, regardless of relationship status. Availability varies by location and version. Smart Tags are passive NFC/QR tags, not GPS trackers.'],
    ['Full existing Terms', 'The complete published application Terms dated 30 January 2024 are retained below. Transaction-specific terms also apply where presented. Contact support if anything is unclear.']
  ]},
  about: { title: 'About OkTreat', intro: 'Give care. Earn TreatCoins. Get care.', sections: [
    ['Pet care that gives back', 'Care for another member’s pet, earn TreatCoins, then use them to request care for your own—even with a different member. Discover boarding, house sitting, drop-in visits, day care and pet walking. Chat and meet before booking.'],
    ['PALS', 'Travel solo. Find your people. PALS helps adult solo travellers meet new friends, with or without a dog and regardless of relationship status. Use profiles, trips, invitations and accepted-only conversations. Live identity checks are required before invitations and chat.'],
    ['Smart Tag', 'A QR scan or NFC tap opens the linked pet profile. Keep contact details current. The passive tag is not a GPS tracker.'],
    ['We are still growing', 'Local member availability varies. Sitter matching improvements are ongoing. eSIMs, insurance and PALS AI are not being announced as launched here.'],
    ['Get help', 'Open Help & Support to contact the OkTreat team. For immediate danger or an urgent animal-health concern, contact local emergency services or a veterinarian.']
  ]}
};

const fr = {
  back: 'Retour', support: 'Aide et assistance', fullTerms: 'Lire les conditions intégrales existantes (anglais)', closeTerms: 'Fermer les conditions', updated: 'Informations mises à jour le 10 novembre 2026',
  privacyChoices: { title: 'Choix de confidentialité', intro: 'Choisissez ce que vous partagez et votre visibilité.', sections: [
    ['Votre profil', 'Modifiez vos coordonnées dans Paramètres → Paramètres du compte. Dans PALS → Profil, désactivez Afficher mon profil pour ne plus apparaître dans la découverte. Cela ne supprime pas les conversations précédentes.'],
    ['Autorisations du téléphone', 'Gérez la localisation, l’appareil photo, les photos et les notifications dans les réglages du téléphone pour OkTreat. Certaines fonctions nécessitent ces autorisations. La personne qui trouve un Smart Tag peut consulter le profil public sans partager sa position.'],
    ['Données publiques de l’animal', 'Vérifiez les coordonnées et informations publiques du Smart Tag avant de le partager. Toute personne disposant du lien peut les consulter.'],
    ['Vos données', 'Utilisez Paramètres → Supprimer le compte, ou contactez l’assistance pour accéder à vos données, les corriger ou demander leur suppression. Certains enregistrements peuvent être conservés pour des obligations opérationnelles ou légales.'],
    ['Vérification d’identité', 'Lisez les informations et choix de Stripe avant une vérification réelle. Les photos de la galerie PALS sont distinctes du selfie de vérification et ne sont pas actuellement comparées au visage.']
  ]},
  privacyPolicy: { title: 'Politique de confidentialité', intro: 'Utilisation des informations dans l’application OkTreat et ses services connectés.', sections: [
    ['Informations traitées', 'Les fonctions du compte utilisent les informations fournies : nom, e-mail, téléphone, adresse, profils, animaux, photos, réservations, messages, avis, paiements et activité TreatCoins. PALS utilise aussi les présentations, centres d’intérêt, langues, destinations, dates, invitations et conversations. Les demandes d’assistance sont liées au compte.'],
    ['Localisation et visibilité', 'La localisation fournie ou autorisée permet les recherches de garde et les fonctions pour animaux perdus. Les données publiques du Smart Tag sont accessibles via son lien. La visibilité PALS détermine si les autres membres peuvent découvrir votre profil.'],
    ['Finalités', 'Nous utilisons les informations pour les comptes, recherches, réservations, messages, paiements, assistance, notifications activées, protection du service et résolution des problèmes. Les recommandations utilisent les notes des réservations terminées ; ce modèle n’envoie pas les notes privées de garde ni le texte des avis à un service d’IA externe. Elles ne garantissent pas l’adéquation.'],
    ['Paiements et identité', 'Stripe traite les paiements concernés et les vérifications réelles. Stripe Identity recueille des images de pièce d’identité, selfies et données extraites, puis compare biométriquement le selfie à la pièce. OkTreat reçoit les résultats et peut accéder aux informations disponibles dans son compte Stripe, mais pas aux identifiants biométriques. Les photos de galerie ne sont pas comparées au selfie. Stripe peut collecter des données d’appareil et d’interaction pour la prévention des fraudes et l’analyse du service. Consultez ses notices et choix pendant le parcours.'],
    ['Prestataires et conservation', 'Les données sont traitées par le service OkTreat sur DigitalOcean et les prestataires concernés. Les anciennes demandes d’assistance peuvent rester chez l’ancien prestataire. Un traitement hors de votre pays est possible. La durée de conservation dépend des données, des besoins et des obligations. Nous ne vendons pas vos informations personnelles.'],
    ['Choix et contact', 'Modifiez les paramètres disponibles et les autorisations du téléphone. Contactez careteam@oktreat.com via l’assistance pour l’accès, la correction, la suppression ou la conservation. Une vérification de votre identité peut être nécessaire. Certains enregistrements doivent être conservés pour des raisons opérationnelles ou légales légitimes. Cette notice peut évoluer.']
  ]},
  terms: { title: 'Conditions d’utilisation', intro: 'Ce résumé explique les points essentiels sans remplacer les conditions intégrales existantes, disponibles ci-dessous en anglais. Cet écran ne demande pas d’accepter un nouvel accord.', sections: [
    ['Compte et garde', 'Protégez votre compte et fournissez des informations exactes. Discutez des besoins de votre animal et convenez des modalités avant la réservation. Un profil, une vérification ou une conversation ne garantit ni l’adéquation ni la sécurité.'],
    ['TreatCoins', 'Les TreatCoins sont des crédits internes de garde, distincts d’ALOHA. Consultez les règles d’achat, réservation, blocage, annulation, réalisation et retrait lors de la transaction. Les TreatCoins achetés ne peuvent pas être retirés en argent.'],
    ['Communauté et disponibilité', 'N’usurpez pas d’identité, ne harcelez pas, ne détournez pas de données et ne perturbez pas le service. PALS accueille les voyageurs adultes seuls, quel que soit leur statut sentimental. La disponibilité varie selon le lieu et la version. Le Smart Tag NFC/QR passif n’est pas un traceur GPS.'],
    ['Conditions intégrales existantes', 'Le texte intégral publié de l’application, daté du 30 janvier 2024, est conservé ci-dessous. Les conditions propres à une transaction s’appliquent lorsqu’elles sont présentées. Contactez l’assistance en cas de doute.']
  ]},
  about: { title: 'À propos d’OkTreat', intro: 'Donnez de votre temps. Gagnez des TreatCoins. Faites garder votre animal.', sections: [
    ['La garde réciproque', 'Gardez l’animal d’un membre, gagnez des TreatCoins et utilisez-les pour demander une garde à un autre membre. Pension, garde à domicile, visites, garderie et promenades : échangez et rencontrez-vous avant de réserver.'],
    ['PALS', 'Voyagez en solo et faites de nouvelles rencontres amicales. PALS accueille les adultes, avec ou sans chien, quel que soit leur statut sentimental. Profils, voyages, invitations et conversations après acceptation. Une vérification d’identité réelle est nécessaire avant les invitations et le chat.'],
    ['Smart Tag', 'Un scan QR ou un contact NFC ouvre le profil de l’animal. Actualisez les coordonnées. Ce tag passif n’est pas un traceur GPS.'],
    ['Une communauté qui grandit', 'La disponibilité locale varie. Les améliorations du matching se poursuivent. Les eSIM, l’assurance et l’IA PALS ne sont pas annoncées ici comme lancées.'],
    ['Assistance', 'Ouvrez Aide et assistance pour joindre l’équipe. En cas de danger immédiat ou d’urgence vétérinaire, contactez les services locaux ou un vétérinaire.']
  ]}
};

const ja = {
  back: '戻る', support: 'ヘルプ・サポート', fullTerms: '既存の利用規約の全文を読む（英語）', closeTerms: '規約全文を閉じる', updated: '情報更新日：2026年11月10日',
  privacyChoices: { title: 'プライバシーの選択', intro: '共有する情報とプロフィールの公開範囲を管理できます。', sections: [
    ['プロフィール', '設定 → アカウント設定で情報を編集できます。PALS → プロフィールの「プロフィールを表示」をオフにすると検索に表示されなくなります。過去の会話は削除されません。'],
    ['端末のアクセス許可', '端末のOkTreat設定で位置情報、カメラ、写真、通知の許可を管理してください。許可を無効にすると一部の機能が制限されます。Smart Tagの発見者は位置情報を共有せずに公開プロフィールを閲覧できます。'],
    ['ペットの公開情報', 'Smart Tagを共有する前に、公開する連絡先とペット情報を確認してください。リンクを持つ人は公開情報を閲覧できます。'],
    ['ご自身のデータ', '設定 → アカウントを削除、またはサポートから開示・訂正・削除を依頼できます。運用上または法令上の義務により一部の記録が保持される場合があります。'],
    ['本人確認', '本番の本人確認を始める前にStripeの説明と選択肢をご確認ください。PALSのギャラリー写真は確認用セルフィーとは別で、現在は顔照合されません。']
  ]},
  privacyPolicy: { title: 'プライバシーポリシー', intro: 'OkTreatアプリと関連サービスにおける情報の取り扱いについて。', sections: [
    ['取り扱う情報', 'アカウントとサービスでは、ご提供いただく氏名、メール、電話、住所、プロフィール、ペット情報、写真、予約、メッセージ、レビュー、支払い、TreatCoinsの履歴を処理します。PALSでは自己紹介、興味、言語、目的地、日程、招待、会話も使用します。サポートへの問い合わせはアカウントに関連付けられます。'],
    ['位置情報と公開範囲', '提供または許可された位置情報は近隣のケア検索や迷子機能に使用されます。Smart Tagの公開情報はリンクから閲覧できます。PALSの公開設定によって他のメンバーがプロフィールを発見できるかが決まります。'],
    ['利用目的', 'アカウント、検索、予約、メッセージ、支払い、サポート、有効にした通知、サービス保護、不正や障害の調査に使用します。シッターの推薦は完了した予約の評価を使用し、このモデルは非公開のケアメモやレビュー本文を外部AIサービスに送信しません。推薦は適性を保証しません。'],
    ['支払いと本人確認', 'Stripeが対象の支払いと本番の本人確認を処理します。Stripe Identityは身分証画像、確認用セルフィー、抽出した本人情報を収集し、身分証とセルフィーを生体照合します。OkTreatは結果とStripeアカウントで利用可能な情報にアクセスできますが、生体識別子は共有されません。ギャラリー写真はセルフィーと照合されません。Stripeは不正防止やサービス分析のために端末・操作情報を収集する場合があります。各手続きでStripeの説明と選択肢をご確認ください。'],
    ['委託先と保存', '記録はDigitalOcean上のOkTreatサービスと関連する委託先が処理します。以前のサポート記録は旧提供者に残る場合があります。国外で処理される場合もあります。保存期間は記録、サービス上の必要性、適用される義務によります。個人情報を販売しません。'],
    ['選択とお問い合わせ', '利用可能なプロフィール設定や端末の許可を管理できます。開示、訂正、削除、保存についてはサポートまたはcareteam@oktreat.comへご連絡ください。本人確認が必要な場合があります。正当な運用上・法令上の理由で一部の記録を保持する場合があります。サービスの変更に応じて本説明を更新します。']
  ]},
  terms: { title: '利用規約', intro: '以下は主な内容の要約です。下に掲載する既存の英語規約全文に代わるものではありません。この画面で新たな契約への同意は求めません。', sections: [
    ['アカウントとケア', 'アカウントを安全に管理し、正確な情報を提供してください。予約前にペットのニーズとケア内容を話し合ってください。プロフィール、本人確認、会話は適性や安全性を保証しません。'],
    ['TreatCoins', 'TreatCoinsはALOHAとは別の内部ケアクレジットです。各取引で購入、予約、保留、キャンセル、完了、換金に関する現行ルールをご確認ください。購入したTreatCoinsは換金できません。'],
    ['コミュニティと利用可能性', 'なりすまし、嫌がらせ、個人情報の悪用、サービス妨害は禁止です。PALSは交際・婚姻状況に関係なく、一人旅の成人が友人を見つけるための機能です。地域やバージョンにより利用可能な機能は異なります。受動型NFC/QRのSmart TagはGPS追跡機器ではありません。'],
    ['既存の規約全文', '公開済みのアプリ規約全文（2024年1月30日付）を下に保存しています。提示される取引固有の条件も適用されます。不明点はサポートへお問い合わせください。']
  ]},
  about: { title: 'OkTreatについて', intro: 'ケアを提供。TreatCoinsを獲得。ケアを依頼。', sections: [
    ['助け合うペットケア', '他のメンバーのペットをケアしてTreatCoinsを獲得し、別のメンバーにもご自身のペットのケアを依頼できます。お預かり、自宅でのケア、訪問、日中預かり、お散歩を検索できます。予約前にチャットや対面で話し合いましょう。'],
    ['PALS', '一人旅で、新しい友人を。犬の同伴や交際・婚姻状況に関係なく成人の旅行者を歓迎します。プロフィール、旅行、招待、承諾後の会話を利用できます。招待とチャットの前に本番の本人確認が必要です。'],
    ['Smart Tag', 'QRスキャンやNFCタップでペットのプロフィールが開きます。連絡先を最新にしてください。受動型タグはGPS追跡機器ではありません。'],
    ['成長中のコミュニティ', '地域のメンバー数によって利用可能性は異なります。シッターマッチングを継続改善しています。eSIM、保険、PALS AIの提供開始をここで案内するものではありません。'],
    ['サポート', 'ヘルプ・サポートからOkTreatチームに連絡できます。差し迫った危険や動物の健康上の緊急時は地域の緊急窓口や獣医師へご連絡ください。']
  ]}
};

const de = {
  back: 'Zurück', support: 'Hilfe & Support', fullTerms: 'Vollständige bestehende Bedingungen lesen (Englisch)', closeTerms: 'Volltext schließen', updated: 'Informationen aktualisiert am 10. November 2026',
  privacyChoices: { title: 'Datenschutzeinstellungen', intro: 'Bestimmen Sie, was Sie teilen und wo Ihr Profil erscheint.', sections: [
    ['Ihr Profil', 'Bearbeiten Sie Ihre Angaben unter Einstellungen → Kontoeinstellungen. Deaktivieren Sie unter PALS → Profil die Profilanzeige, um nicht mehr in der Suche zu erscheinen. Frühere Gespräche werden dadurch nicht gelöscht.'],
    ['Geräteberechtigungen', 'Verwalten Sie Standort, Kamera, Fotos und Mitteilungen in den Geräteeinstellungen für OkTreat. Ohne Berechtigung können Funktionen eingeschränkt sein. Smart-Tag-Finder können das öffentliche Tierprofil ohne Standortfreigabe ansehen.'],
    ['Öffentliche Tierdaten', 'Prüfen Sie öffentliche Kontakt- und Tierdaten, bevor Sie Ihren Smart Tag teilen. Jeder mit dem Link kann die öffentlichen Informationen sehen.'],
    ['Ihre Daten', 'Nutzen Sie Einstellungen → Konto löschen oder wenden Sie sich wegen Auskunft, Berichtigung oder Löschung an den Support. Bestimmte Aufzeichnungen können aus betrieblichen oder gesetzlichen Gründen aufbewahrt werden.'],
    ['Identitätsprüfung', 'Lesen Sie vor einer echten Identitätsprüfung die Hinweise und Wahlmöglichkeiten von Stripe. PALS-Galeriefotos sind vom Prüfselfie getrennt und werden derzeit nicht per Gesichtsvergleich abgeglichen.']
  ]},
  privacyPolicy: { title: 'Datenschutzerklärung', intro: 'So verwendet die OkTreat-App mit ihren verbundenen Diensten Informationen.', sections: [
    ['Verarbeitete Informationen', 'Konto- und Dienstfunktionen verarbeiten bereitgestellte Namen, E-Mail, Telefon, Adresse, Profile, Tierdaten, Fotos, Buchungen, Nachrichten, Bewertungen, Zahlungen und TreatCoins-Aktivitäten. PALS nutzt außerdem Vorstellung, Interessen, Sprachen, Reiseziele, Daten, Einladungen und Gespräche. Supportanfragen sind dem Konto zugeordnet.'],
    ['Standort und Sichtbarkeit', 'Bereitgestellte oder erlaubte Standortdaten unterstützen die Betreuungssuche und Vermisstfunktionen. Öffentliche Smart-Tag-Daten sind über den Link sichtbar. PALS-Sichtbarkeit bestimmt, ob andere Mitglieder Ihr Profil entdecken können.'],
    ['Zwecke', 'Wir nutzen Informationen für Konten, Suche, Buchungen, Nachrichten, Zahlungen, Support, aktivierte Mitteilungen, Schutz des Dienstes und Untersuchung von Missbrauch oder Fehlern. Empfehlungen nutzen Bewertungen abgeschlossener Buchungen; dieses Modell sendet keine privaten Betreuungsnotizen oder Bewertungstexte an externe KI-Dienste. Empfehlungen garantieren keine Eignung.'],
    ['Zahlung und Identität', 'Stripe bearbeitet betreffende Zahlungen und echte Identitätsprüfungen. Stripe Identity erfasst Ausweisbilder, Prüfselfies und ausgelesene Identitätsdaten und vergleicht Selfie und Ausweis biometrisch. OkTreat erhält Ergebnisse und kann auf im Stripe-Konto verfügbare Informationen zugreifen; biometrische Identifikatoren werden nicht mit OkTreat geteilt. Galeriefotos werden nicht mit dem Selfie abgeglichen. Stripe kann Geräte- und Interaktionsdaten zur Betrugsprävention und Dienstanalyse erfassen. Lesen Sie die Hinweise und Auswahlmöglichkeiten im jeweiligen Ablauf.'],
    ['Anbieter und Speicherung', 'Daten werden vom OkTreat-Dienst auf DigitalOcean und beteiligten Anbietern verarbeitet. Frühere Supportanfragen können beim bisherigen Anbieter verbleiben. Verarbeitung außerhalb Ihres Landes ist möglich. Die Dauer richtet sich nach Datensatz, Bedarf und geltenden Pflichten. Wir verkaufen keine personenbezogenen Daten.'],
    ['Wahlmöglichkeiten und Kontakt', 'Bearbeiten Sie verfügbare Profileinstellungen und Geräteberechtigungen. Kontaktieren Sie den Support oder careteam@oktreat.com für Auskunft, Berichtigung, Löschung oder Aufbewahrung. Wir können Ihre Identität prüfen. Manche Daten müssen aus berechtigten betrieblichen oder gesetzlichen Gründen erhalten bleiben. Diese Hinweise können aktualisiert werden.']
  ]},
  terms: { title: 'Nutzungsbedingungen', intro: 'Diese Zusammenfassung ersetzt nicht die vollständigen bestehenden Bedingungen, die unten auf Englisch verfügbar sind. Hier wird keine Zustimmung zu einer neuen Vereinbarung verlangt.', sections: [
    ['Konto und Betreuung', 'Schützen Sie Ihr Konto und machen Sie korrekte Angaben. Besprechen Sie die Bedürfnisse Ihres Tieres und die Betreuung vor der Buchung. Profil, Identitätsprüfung oder Gespräch garantieren weder Eignung noch Sicherheit.'],
    ['TreatCoins', 'TreatCoins sind interne Betreuungsguthaben, getrennt von ALOHA. Prüfen Sie bei der Transaktion die Regeln für Kauf, Buchung, Reservierung, Stornierung, Abschluss und Auszahlung. Gekaufte TreatCoins können nicht ausgezahlt werden.'],
    ['Gemeinschaft und Verfügbarkeit', 'Keine Identitätstäuschung, Belästigung, missbräuchliche Datennutzung oder Dienststörung. PALS ist für erwachsene Alleinreisende unabhängig vom Beziehungsstatus. Funktionen variieren nach Ort und Version. Passive NFC/QR-Smart-Tags sind keine GPS-Tracker.'],
    ['Bestehender Volltext', 'Die vollständig veröffentlichten App-Bedingungen vom 30. Januar 2024 bleiben unten erhalten. Angezeigte transaktionsbezogene Bedingungen gelten ebenfalls. Bei Fragen hilft der Support.']
  ]},
  about: { title: 'Über OkTreat', intro: 'Betreuung geben. TreatCoins verdienen. Betreuung erhalten.', sections: [
    ['Gegenseitige Tierbetreuung', 'Betreuen Sie das Tier eines Mitglieds, verdienen Sie TreatCoins und fragen Sie damit Betreuung bei einem anderen Mitglied an. Tierpension, Haussitting, Besuche, Tagesbetreuung und Spaziergänge. Sprechen Sie vor der Buchung miteinander und treffen Sie sich.'],
    ['PALS', 'Allein reisen, neue Freunde finden. PALS ist für erwachsene Alleinreisende mit oder ohne Hund, unabhängig vom Beziehungsstatus. Profile, Reisen, Einladungen und Gespräche nach Annahme. Vor Einladungen und Chat ist eine echte Identitätsprüfung erforderlich.'],
    ['Smart Tag', 'QR-Scan oder NFC-Tipp öffnen das Tierprofil. Halten Sie Kontaktdaten aktuell. Der passive Tag ist kein GPS-Tracker.'],
    ['Wir wachsen weiter', 'Die lokale Verfügbarkeit variiert. Sitter-Matching wird weiter verbessert. eSIMs, Versicherung und PALS-KI werden hier nicht als gestartet angekündigt.'],
    ['Hilfe', 'Kontaktieren Sie das Team über Hilfe & Support. Bei unmittelbarer Gefahr oder tiermedizinischen Notfällen wenden Sie sich an lokale Notdienste oder einen Tierarzt.']
  ]}
};

const zh = {
  back: '返回', support: '帮助与支持', fullTerms: '阅读现有完整条款（英文）', closeTerms: '关闭完整条款', updated: '信息更新于2026年11月10日',
  privacyChoices: { title: '隐私选项', intro: '管理您分享的信息及个人资料的可见性。', sections: [
    ['个人资料', '在设置 → 账户设置中修改资料。在PALS → 个人资料中关闭“显示我的资料”，即可停止出现在发现列表中。隐藏资料不会删除以往对话。'],
    ['设备权限', '在手机的OkTreat设置中管理位置、相机、照片及通知权限。关闭权限可能影响相关功能。发现Smart Tag的人无需分享位置，也能查看宠物公开资料。'],
    ['宠物公开信息', '分享Smart Tag前，请检查公开的联系及宠物信息。任何持有链接的人都可以查看公开内容。'],
    ['您的数据', '使用设置 → 删除账户，或联系支持团队申请访问、更正或删除数据。部分记录可能因运营或法律义务而保留。'],
    ['身份验证', '开始正式身份验证前，请阅读Stripe的说明和选项。PALS相册照片与验证自拍分开，目前不会进行人脸匹配。']
  ]},
  privacyPolicy: { title: '隐私政策', intro: 'OkTreat应用及其关联服务如何使用信息。', sections: [
    ['处理的信息', '账户及服务功能会处理您提供的姓名、邮箱、电话、地址、个人及宠物资料、照片、预订、消息、评价、付款与TreatCoins记录。PALS还使用自我介绍、兴趣、语言、目的地、日期、邀请及对话。支持请求与账户关联。'],
    ['位置和可见性', '您提供或允许使用的位置用于附近照护搜索及走失宠物功能。任何打开Smart Tag链接的人都能看到公开资料。PALS可见性设置决定其他会员能否发现您的资料。'],
    ['使用目的', '信息用于账户、搜索、预订、消息、付款、支持、已开启的通知、保护服务，以及调查滥用或技术问题。照护者推荐使用已完成预订的评分；此模型不会将私人照护笔记或评价正文发送给外部AI服务。推荐不保证适合程度。'],
    ['付款与身份', 'Stripe处理相关付款及正式身份验证。Stripe Identity收集证件图像、验证自拍和提取的身份信息，并对证件与自拍进行生物识别比对。OkTreat收到结果，并可访问Stripe账户中提供的信息，但不会收到生物识别标识符。相册照片不会与自拍匹配。Stripe可能收集设备及交互数据，用于防欺诈和服务分析。请在相关流程中阅读Stripe的说明与选项。'],
    ['服务商与存储', '记录由DigitalOcean上的OkTreat服务和相关服务商处理。旧支持请求可能仍保存在原服务商处。数据可能在您所在国家以外处理。保存时间取决于记录、服务需要和适用义务。我们不出售您的个人信息。'],
    ['选择与联系', '您可修改可用的资料设置及设备权限。如需访问、更正、删除或了解保存情况，请通过支持或careteam@oktreat.com联系。处理请求前可能需要验证身份。部分记录可能因正当运营或法律原因保留。服务变化时，本说明可能更新。']
  ]},
  terms: { title: '服务条款', intro: '以下为要点摘要，不取代下方保留的现有英文完整条款。本页面不要求接受新协议。', sections: [
    ['账户与照护', '保护账户安全并提供准确信息。预订前讨论宠物需求及照护安排。个人资料、身份验证或对话均不能保证适合程度或安全。'],
    ['TreatCoins', 'TreatCoins是内部宠物照护积分，与ALOHA分开。请在相关交易中查看购买、预订、冻结、取消、完成及提现规则。购买的TreatCoins不可提现。'],
    ['社区与可用性', '不得冒充他人、骚扰、滥用个人信息或干扰服务。PALS供成年独自旅行者结交朋友，不限制感情或婚姻状态。功能因地点及版本而异。被动式NFC/QR Smart Tag不是GPS追踪器。'],
    ['现有完整条款', '下方保留2024年1月30日发布的完整应用条款。交易中展示的特定条款也适用。如有疑问，请联系支持。']
  ]},
  about: { title: '关于OkTreat', intro: '提供照护。赚取TreatCoins。获得照护。', sections: [
    ['互助宠物照护', '照护其他会员的宠物赚取TreatCoins，再向另一会员申请自己宠物的照护。可寻找寄养、上门留宿、探访、日托及遛宠服务。预订前先聊天并见面了解。'],
    ['PALS', '独自旅行，结交朋友。欢迎成年独自旅行者，无论是否带狗，也不限制感情或婚姻状态。可使用资料、行程、邀请及接受后的对话。邀请与聊天前需要正式身份验证。'],
    ['Smart Tag', '扫描QR码或轻触NFC即可打开宠物资料。请更新联系方式。被动式标签不是GPS追踪器。'],
    ['持续成长', '附近会员及服务可用性有所不同。照护者匹配仍在持续改进。此处不宣称eSIM、保险或PALS AI已经上线。'],
    ['获取帮助', '打开帮助与支持联系OkTreat团队。如遇即时危险或动物健康紧急情况，请联系当地紧急服务或兽医。']
  ]}
};

export const INFORMATION_LANGUAGES = ['en-us', 'en-uk', 'fr', 'ja', 'de', 'zh'];
export const INFORMATION_PAGES = ['privacyChoices', 'privacyPolicy', 'terms', 'about'];
export function getInformation(language, page) {
  const code = String(language || 'en-us').toLowerCase().split('-')[0];
  const bundle = ({ fr, ja, de, zh })[code] || en;
  const key = INFORMATION_PAGES.includes(page) ? page : 'privacyPolicy';
  return { ...bundle[key], back: bundle.back, support: bundle.support, fullTerms: bundle.fullTerms, closeTerms: bundle.closeTerms, updated: bundle.updated, key };
}
