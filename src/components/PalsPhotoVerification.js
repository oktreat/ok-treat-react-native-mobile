import React, {useEffect,useRef,useState} from 'react';
import {Alert,Text,TouchableOpacity,View} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import {palsRequest} from '../services/palsService';
import {stripeIdentityUrl} from './PalsIdentityVerification';
import {copy,useCopyUpdates} from '../i18n/copy';

export default function PalsPhotoVerification({photo,identityVerified,onChanged}) {
  useCopyUpdates();
  const [config,setConfig]=useState(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
  const [checkId,setCheckId]=useState(photo?.verification?.status==='PENDING'?photo.verification.checkId:null);
  const active=useRef(true),running=useRef(false),requestId=useRef(null);
  useEffect(()=>{active.current=true;palsRequest('photo-verification').then(c=>{if(active.current)setConfig(c)}).catch(()=>{});return()=>{active.current=false}},[]);
  // Parent keys this component by account and photo, preventing a stale result
  // from modifying a different member or a newly selected main photo.
  const check=async id=>{
    const result=await palsRequest(`photos/${photo.id}/verify/${id}`,{});
    if(!active.current)return;
    if(result.status==='VERIFIED'){setNotice('Photo matched');setCheckId(null);await onChanged();}
    else if(result.status==='PENDING')setNotice('Your photo check is still pending. Complete the Stripe check, then check status.');
    else {setCheckId(null);requestId.current=null;setNotice('We could not match this photo. Use a clear photo of only yourself and try again.');}
  };
  const run=async fn=>{if(running.current)return;running.current=true;setBusy(true);try{await fn()}catch(e){if(active.current){setNotice(e.message);if(e.status===409){setCheckId(null);requestId.current=null;}}}finally{running.current=false;if(active.current)setBusy(false)}};
  const start=()=>Alert.alert(copy('Verify main photo'),copy('Stripe will ask for a camera selfie and photo ID. With your agreement, OkTreat will send the verified selfie and this PALS photo to Amazon Rekognition to compare the faces. Your ID document is not sent to Amazon or shown on PALS. Only this photo receives a matched badge if the check succeeds. Continue?'),[
    {text:copy('Cancel'),style:'cancel'},
    {text:copy('Agree and continue'),onPress:()=>run(async()=>{
      if(!requestId.current)requestId.current=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+'-'+Math.random().toString(36).slice(2);
      const result=await palsRequest(`photos/${photo.id}/verify`,{consent:true,consentVersion:config.consentVersion,requestId:requestId.current});
      if(!active.current)return;
      if(result.status==='VERIFIED'){await onChanged();return;}
      if(['NOT_MATCHED','CANCELED'].includes(result.status)){requestId.current=null;setNotice('We could not match this photo. Use a clear photo of only yourself and try again.');return;}
      if(!stripeIdentityUrl(result.url)||!result.checkId)throw Error('Could not open the photo check. Please try again.');
      setCheckId(result.checkId);
      await WebBrowser.openBrowserAsync(result.url);
      if(active.current)await check(result.checkId);
    })}
  ]);
  if(!photo || !config?.enabled)return null;
  return <View style={{gap:10,paddingTop:14}}>
    <Text style={{fontWeight:'700',color:'#173342'}}>{copy(photo.photoVerified?'Photo matched':'Verify main photo')}</Text>
    <Text style={{color:'#486371',lineHeight:20}}>{copy(photo.photoVerified?'This photo matched the selfie from a completed identity check. This is not a guarantee of safety.':'Choose a clear main photo showing only you. Photo matching is separate from your identity check.')}</Text>
    {!photo.photoVerified&&<TouchableOpacity accessibilityRole="button" disabled={busy||!identityVerified} onPress={checkId?()=>run(()=>check(checkId)):start} style={{padding:14,borderRadius:12,backgroundColor:busy||!identityVerified?'#9EBAC6':'#087EA4',minHeight:48}}><Text style={{color:'white',textAlign:'center',fontWeight:'700'}}>{copy(busy?'Please wait…':checkId?'Check photo status':'Verify main photo')}</Text></TouchableOpacity>}
    {!identityVerified&&<Text>{copy('Complete your live identity check before verifying a PALS photo.')}</Text>}
    {!!notice&&<Text accessibilityLiveRegion="polite">{copy(notice)}</Text>}
  </View>;
}
