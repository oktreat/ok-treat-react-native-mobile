import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import api from '../../config/api';
import { getUserPets } from '../../services/petService';

export default function AiVetScreen({ navigation, route }) {
  const [pets, setPets] = useState([]);
  const [pet, setPet] = useState(route?.params?.pet || null);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    getUserPets().then(result => {
      const list = result?.data?.pets || result?.pets || [];
      if (mounted && Array.isArray(list)) {
        setPets(list);
        if (!pet && list.length) setPet(list[0]);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const ask = async () => {
    const prompt = question.trim();
    if (!prompt || loading) return;
    setQuestion('');
    setMessages(current => [...current, { role: 'you', text: prompt }]);
    setLoading(true);
    try {
      const response = await api.post('/ai/pet-care', {
        question: prompt,
        pet: pet ? { name: pet.name, type: pet.type, age: pet.age || pet.ageDisplay } : undefined,
      });
      const answer = response.data?.data?.answer;
      if (!answer) throw new Error('AiVet did not return an answer.');
      setMessages(current => [...current, { role: 'ai', text: answer }]);
    } catch (error) {
      const text = error.response?.data?.message || 'AiVet is not available yet. Please contact your veterinarian for care advice.';
      setMessages(current => [...current, { role: 'ai', text }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper noBottomTabs>
      <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back" style={s.back}><Icon name="chevron-back" size={24} color="#173342" /></TouchableOpacity>
          <View style={{ flex: 1 }}><Text style={s.title}>AiVet</Text><Text style={s.subtitle}>Pet-care questions, answered simply</Text></View>
          <Icon name="sparkles-outline" size={26} color="#1686A8" />
        </View>
        <View style={s.disclaimer}><Icon name="information-circle-outline" size={20} color="#825B16" /><Text style={s.disclaimerText}>General information only—not a diagnosis or a substitute for a veterinarian. For urgent symptoms, contact an emergency vet now.</Text></View>
        {!!pets.length && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.petPicker}>{pets.map(item => <TouchableOpacity key={item.id} onPress={() => setPet(item)} style={[s.petChip, pet?.id === item.id && s.petChipSelected]}><Text style={[s.petChipText, pet?.id === item.id && s.petChipTextSelected]}>{item.name}</Text></TouchableOpacity>)}</ScrollView>}
        <ScrollView ref={scrollRef} style={s.messages} contentContainerStyle={s.messagesInner} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {!messages.length && <View style={s.welcome}><Icon name="paw-outline" size={36} color="#1686A8" /><Text style={s.welcomeTitle}>What would you like to know?</Text><Text style={s.welcomeText}>Ask about everyday care, behaviour, or preparing for a vet visit.</Text></View>}
          {messages.map((item, index) => <View key={index} style={[s.message, item.role === 'you' ? s.userMessage : s.aiMessage]}><Text style={item.role === 'you' ? s.userMessageText : s.aiMessageText}>{item.text}</Text></View>)}
          {loading && <View style={[s.message, s.aiMessage, s.loading]}><ActivityIndicator color="#1686A8" /><Text style={s.aiMessageText}>Thinking…</Text></View>}
        </ScrollView>
        <View style={s.composer}><TextInput value={question} onChangeText={setQuestion} placeholder="Ask a pet-care question…" placeholderTextColor="#71818A" multiline maxLength={1200} style={s.input} returnKeyType="send" onSubmitEditing={ask} /><TouchableOpacity onPress={ask} disabled={!question.trim() || loading} accessibilityRole="button" accessibilityLabel="Ask AiVet" style={[s.send, (!question.trim() || loading) && s.disabled]}><Icon name="arrow-up" size={22} color="white" /></TouchableOpacity></View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({screen:{flex:1,backgroundColor:'#F6FAFC'},header:{flexDirection:'row',alignItems:'center',paddingHorizontal:18,paddingVertical:14,borderBottomWidth:1,borderColor:'#E4EDF2',backgroundColor:'white'},back:{padding:6,marginRight:8},title:{fontSize:22,fontWeight:'800',color:'#173342'},subtitle:{fontSize:13,color:'#5C707C',marginTop:2},disclaimer:{flexDirection:'row',gap:8,margin:16,padding:12,borderRadius:14,backgroundColor:'#FFF4D8',alignItems:'flex-start'},disclaimerText:{flex:1,color:'#6A4B10',fontSize:13,lineHeight:19},petPicker:{paddingHorizontal:16,paddingBottom:6,gap:8},petChip:{borderWidth:1,borderColor:'#C7D8E2',borderRadius:20,paddingVertical:8,paddingHorizontal:14,backgroundColor:'white'},petChipSelected:{backgroundColor:'#1686A8',borderColor:'#1686A8'},petChipText:{color:'#284653',fontWeight:'600'},petChipTextSelected:{color:'white'},messages:{flex:1},messagesInner:{padding:16,gap:10,flexGrow:1,justifyContent:'flex-end'},welcome:{alignItems:'center',padding:26,marginVertical:'auto'},welcomeTitle:{fontSize:19,fontWeight:'700',color:'#173342',marginTop:14},welcomeText:{fontSize:14,color:'#617783',textAlign:'center',marginTop:7,lineHeight:21},message:{maxWidth:'88%',padding:13,borderRadius:16},userMessage:{alignSelf:'flex-end',backgroundColor:'#1686A8',borderBottomRightRadius:4},aiMessage:{alignSelf:'flex-start',backgroundColor:'white',borderWidth:1,borderColor:'#E2ECF0',borderBottomLeftRadius:4},userMessageText:{color:'white',fontSize:15,lineHeight:21},aiMessageText:{color:'#243D49',fontSize:15,lineHeight:22},loading:{flexDirection:'row',gap:10,alignItems:'center'},composer:{flexDirection:'row',alignItems:'flex-end',gap:10,padding:12,paddingBottom:16,borderTopWidth:1,borderColor:'#E4EDF2',backgroundColor:'white'},input:{flex:1,maxHeight:120,minHeight:44,borderRadius:18,borderWidth:1,borderColor:'#D3E1E9',backgroundColor:'#F8FAFB',paddingHorizontal:14,paddingVertical:11,color:'#173342',fontSize:15},send:{width:44,height:44,borderRadius:22,backgroundColor:'#1686A8',alignItems:'center',justifyContent:'center'},disabled:{opacity:.45}});
