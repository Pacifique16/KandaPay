import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { payBill } from '../../services/ussdService';

export default function BillPaymentScreen() {
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { selectedSlot, detectedOperator } = useSelector((s: RootState) => s.sim);

  const handlePay = async () => {
    if (!code || !amount) return Alert.alert('Error', 'Fill in all fields');
    setLoading(true);
    const result = await payBill(code, amount, detectedOperator, selectedSlot);
    setLoading(false);
    Alert.alert(result.success ? 'Success' : 'Failed', result.response ?? result.error ?? 'Unknown');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pay Bill</Text>
      <Text style={styles.operator}>{detectedOperator}</Text>
      <TextInput style={styles.input} placeholder="Bill/Merchant code" keyboardType="numeric" value={code} onChangeText={setCode} />
      <TextInput style={styles.input} placeholder="Amount (RWF)" keyboardType="numeric" value={amount} onChangeText={setAmount} />
      <TouchableOpacity style={styles.btn} onPress={handlePay} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Pay Bill</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 48, marginBottom: 4 },
  operator: { color: '#666', marginBottom: 32 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 16 },
  btn: { backgroundColor: '#EA4335', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
