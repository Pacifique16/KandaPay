import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { checkBalance } from '../../services/ussdService';

export default function BalanceScreen() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const { selectedSlot, detectedOperator } = useSelector((s: RootState) => s.sim);

  const handleCheck = async () => {
    if (detectedOperator === 'UNKNOWN') return;
    setLoading(true);
    const result = await checkBalance(detectedOperator, selectedSlot);
    setLoading(false);
    setResponse(result.response ?? result.error ?? 'No response');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check Balance</Text>
      <Text style={styles.operator}>{detectedOperator} Mobile Money</Text>
      {!!response && <View style={styles.responseBox}><Text style={styles.responseText}>{response}</Text></View>}
      <TouchableOpacity style={styles.btn} onPress={handleCheck} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Check Balance</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 48, marginBottom: 4 },
  operator: { color: '#666', marginBottom: 32 },
  responseBox: { backgroundColor: '#f0f7ff', borderRadius: 12, padding: 20, marginBottom: 24 },
  responseText: { fontSize: 18, color: '#1A73E8', textAlign: 'center' },
  btn: { backgroundColor: '#FBBC04', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
