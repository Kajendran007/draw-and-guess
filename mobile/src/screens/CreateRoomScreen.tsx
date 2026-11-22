import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../theme';
import { useGame } from '../context/GameContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateRoom'>;
};

export default function CreateRoomScreen({ navigation }: Props) {
  const { createRoom } = useGame();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleCreate = () => {
    if (!name.trim()) {
      setError('Enter your name first.');
      shake();
      return;
    }
    setLoading(true);
    setError('');
    createRoom(name.trim(), (err) => {
      setLoading(false);
      if (err) {
        setError(err);
        shake();
      } else {
        navigation.navigate('Lobby');
      }
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <View style={[styles.blob, styles.blob1]} />

      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.emoji}>✏️</Text>
        <Text style={styles.title}>Create a Room</Text>
        <Text style={styles.sub}>You'll be the host</Text>

        <View style={styles.card}>
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <Text style={styles.label}>Your name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Picasso"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={t => { setName(t); setError(''); }}
              maxLength={16}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
              editable={!loading}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </Animated.View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Create Room 🎉</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.board, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.12 },
  blob1: { width: 300, height: 300, backgroundColor: Colors.teal, top: -60, right: -60 },
  back: { margin: Spacing.lg, marginTop: Spacing.xl + 10 },
  backText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: Spacing.xl, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 56, marginBottom: Spacing.md },
  title: { fontSize: FontSize.xxxl, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -1, marginBottom: Spacing.xs },
  sub: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xl },
  card: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: Spacing.md,
    ...Shadow.md,
  },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600', marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    backgroundColor: Colors.boardLight,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  error: { color: Colors.error, fontSize: FontSize.sm, fontWeight: '600', marginBottom: Spacing.xs },
  btn: {
    backgroundColor: Colors.teal,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xs,
    ...Shadow.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '800' },
});
