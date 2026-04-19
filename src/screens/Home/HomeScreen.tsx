import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { getSimCards } from '../../modules/ussd/UssdBridge';
import { setSimCards, setDetectedOperator } from '../../store/slices/simSlice';
import { RootState } from '../../store';

export default function HomeScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const { detectedOperator } = useSelector((s: RootState) => s.sim);

  useEffect(() => {
    getSimCards().then(sims => {
      dispatch(setSimCards(sims));
      if (sims.length > 0) {
        const name = sims[0].operatorName.toUpperCase();
        dispatch(setDetectedOperator(name.includes('MTN') ? 'MTN' : name.includes('AIRTEL') ? 'AIRTEL' : 'UNKNOWN'));
      }
    });
  }, []);

  const actions = [
    { label: 'Send Money', screen: 'Send', color: '#1A73E8' },
    { label: 'Buy Airtime', screen: 'Airtime', color: '#34A853' },
    { label: 'Check Balance', screen: 'Balance', color: '#FBBC04' },
    { label: 'Pay Bill', screen: 'BillPayment', color: '#EA4335' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>KandaPay</Text>
      <Text style={styles.subtitle}>
        {detectedOperator !== 'UNKNOWN' ? detectedOperator + ' SIM detected' : 'Detecting SIM...'}
      </Text>
      <View style={styles.grid}>
        {actions.map(item => (
          <TouchableOpacity
            key={item.screen}
            style={[styles.card, { backgroundColor: item.color }]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.cardText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A73E8', marginTop: 48, marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { width: '46%', height: 120, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cardText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
