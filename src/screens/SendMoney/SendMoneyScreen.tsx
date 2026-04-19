import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { sendMoney } from '../../services/ussdService';

export default function SendMoneyScreen() {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { selectedSlot, detectedOperator } = useSelector((s: RootState) => s.sim);

  const handleSend = async () => {
    if (!phone || !amount) return Alert.alert('Error', 'Please fill in all fields');
    setLoading(true);
    const result = await sendMoney(phone, amount, selectedSlot);
    setLoading(false);
    Alert.alert(result.success ? 'Success' : 'Failed', result.response ?? result.error ?? 'Unknown');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Send Money</Text>
      <Text style={styles.operator}>via {detectedOperator} Mobile Money</Text>
      <TextInput style={styles.input} placeholder="Recipient (07XXXXXXXX)" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      <TextInput style={styles.input} placeholder="Amount (RWF)" keyboardType="numeric" value={amount} onChangeText={setAmount} />
      <TouchableOpacity style={styles.btn} onPress={handleSend} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Money</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 48, marginBottom: 4 },
  operator: { color: '#666', marginBottom: 32 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 16 },
  btn: { backgroundColor: '#1A73E8', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
