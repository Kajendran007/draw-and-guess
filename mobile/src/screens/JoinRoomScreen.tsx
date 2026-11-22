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
  navigation: NativeStackNavigationProp<RootStackParamList, 'JoinRoom'>;
};

export default function JoinRoomScreen({ navigation }: Props) {
  const { joinRoom } = useGame();
  const [code, setCode] = useState('');
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

  const handleJoin = () => {
    if (!code.trim()) { setError('Enter the room code.'); shake(); return; }
    if (!name.trim()) { setError('Enter your name.'); shake(); return; }
    setLoading(true);
    setError('');
    joinRoom(code.trim(), name.trim(), (err) => {
      setLoading(false);
      if (err) { setError(err); shake(); }
      else navigation.navigate('Lobby');
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
        <Text style={styles.emoji}>🚀</Text>
        <Text style={styles.title}>Join a Room</Text>
        <Text style={styles.sub}>Enter the room code to play</Text>

        <View style={styles.card}>
          <Animated.View style={{ transform: [{ translateX: shakeAnim }], gap: Spacing.md }}>
            <View>
              <Text style={styles.label}>Room Code</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="e.g. AB3X7K"
                placeholderTextColor={Colors.textMuted}
                value={code}
                onChangeText={t => { setCode(t.toUpperCase()); setError(''); }}
                maxLength={6}
                autoCapitalize="characters"
                autoFocus
                returnKeyType="next"
                editable={!loading}
              />
            </View>
            <View>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Van Gogh"
                placeholderTextColor={Colors.textMuted}
                value={name}
                onChangeText={t => { setName(t); setError(''); }}
                maxLength={16}
                returnKeyType="done"
                onSubmitEditing={handleJoin}
                editable={!loading}
              />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </Animated.View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleJoin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Join Room 🎮</Text>
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
  blob1: { width: 300, height: 300, backgroundColor: Colors.pink, bottom: -60, left: -60 },
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
  label: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600', marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    backgroundColor: Colors.boardLight,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  codeInput: {
    letterSpacing: 6,
    fontWeight: '800',
    fontSize: FontSize.xl,
    textAlign: 'center',
  },
  error: { color: Colors.error, fontSize: FontSize.sm, fontWeight: '600' },
  btn: {
    backgroundColor: Colors.pink,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xs,
    ...Shadow.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '800' },
});
