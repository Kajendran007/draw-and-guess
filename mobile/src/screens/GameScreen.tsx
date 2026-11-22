import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../theme';
import { useGame } from '../context/GameContext';
import DrawingCanvas from '../components/DrawingCanvas';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Game'>;
};

export default function GameScreen({ navigation }: Props) {
  const { state, myId, strokes, sendGuess, sendStrokeStart, sendStrokePoint, sendUndo, sendClear } = useGame();
  const [guess, setGuess] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [timeLeft, setTimeLeft] = useState(0);
  const endAtRef = useRef(0);

  useEffect(() => {
    if (!state) return;
    if (state.phase === 'roundEnd') navigation.replace('Score');
    if (state.phase === 'final') navigation.replace('Final');
    if (state.phase === 'lobby') navigation.replace('Lobby');
    endAtRef.current = Date.now() + state.remaining;
  }, [state?.phase, state?.remaining]);

  useEffect(() => {
    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setTimeLeft(left);
    }, 250);
    return () => clearInterval(interval);
  }, []);

  if (!state || state.phase !== 'playing') return null;

  const isDrawer = state.drawerId === myId;
  const me = state.players.find(p => p.id === myId);
  const drawer = state.players.find(p => p.id === state.drawerId);

  const handleGuess = () => {
    if (!guess.trim() || me?.guessed) return;
    sendGuess(guess.trim(), (status) => {
      const msgs: Record<string, [string, string]> = {
        correct: ['🎉 Correct! +1 point', 'ok'],
        wrong: ['❌ Not quite, try again!', 'bad'],
        already: ['✅ You already got it!', 'ok'],
        closed: ['⏱️ Round is over.', 'bad'],
        drawer: ['', ''],
      };
      const [text, type] = msgs[status] ?? ['', ''];
      setMsg({ text, type });
    });
    setGuess('');
  };

  const isLow = timeLeft <= 10;
  const wordDisplay = isDrawer ? state.word : '_ '.repeat(state.wordLen ?? 0).trim();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.roundText}>Round {state.round}/{state.totalRounds}</Text>
          <Text style={styles.drawerText}>
            {isDrawer ? '🎨 You draw!' : `✏️ ${drawer?.name ?? '?'} draws`}
          </Text>
        </View>
        <View style={[styles.timerBox, isLow && styles.timerBoxLow]}>
          <Text style={[styles.timerText, isLow && styles.timerTextLow]}>{timeLeft}</Text>
        </View>
      </View>

      {/* Word display */}
      <View style={styles.wordBar}>
        <Text style={styles.wordText}>{wordDisplay}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Drawing Canvas */}
        <DrawingCanvas
          strokes={strokes}
          isDrawer={isDrawer}
          onStrokeStart={sendStrokeStart}
          onStrokePoint={sendStrokePoint}
          onUndo={sendUndo}
          onClear={sendClear}
        />

        {/* Guess input (guessers only) */}
        {!isDrawer && (
          <View style={styles.guessCard}>
            <Text style={styles.guessTitle}>💬 What is it?</Text>
            <View style={styles.guessRow}>
              <TextInput
                style={[styles.guessInput, (me?.guessed) && styles.guessInputDisabled]}
                placeholder={me?.guessed ? 'You got it!' : 'Type your guess…'}
                placeholderTextColor={Colors.textMuted}
                value={guess}
                onChangeText={setGuess}
                editable={!me?.guessed}
                returnKeyType="send"
                onSubmitEditing={handleGuess}
                maxLength={60}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (me?.guessed || !guess.trim()) && styles.sendBtnDisabled]}
                onPress={handleGuess}
                disabled={me?.guessed || !guess.trim()}
              >
                <Text style={styles.sendBtnText}>Send</Text>
              </TouchableOpacity>
            </View>
            {msg.text ? (
              <Text style={[styles.msgText, msg.type === 'ok' ? styles.msgOk : styles.msgBad]}>{msg.text}</Text>
            ) : null}
          </View>
        )}

        {/* Players */}
        <View style={styles.playerCard}>
          <Text style={styles.playerTitle}>👥 Players</Text>
          {state.players.map(p => {
            const isMe = p.id === myId;
            const isDrawerP = p.id === state.drawerId;
            return (
              <View key={p.id} style={[styles.playerRow, isMe && styles.playerRowMe, isDrawerP && styles.playerRowDrawer, !p.connected && styles.playerRowOff]}>
                <Text style={[styles.playerName, isDrawerP && styles.playerNameDrawer]}>
                  {p.name}{isMe ? ' (you)' : ''}
                </Text>
                <Text style={styles.playerScore}>
                  {isDrawerP ? '🖊️' : p.guessed ? '✓ ' + p.score : p.score}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.board },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl + 10,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.boardLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  topBarLeft: { flex: 1 },
  roundText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '700' },
  drawerText: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '800', marginTop: 2 },
  timerBox: { backgroundColor: Colors.card, borderRadius: Radius.md, width: 56, height: 56, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.cardBorder },
  timerBoxLow: { backgroundColor: Colors.pink, borderColor: Colors.pink },
  timerText: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.textPrimary },
  timerTextLow: { color: '#fff' },
  wordBar: { backgroundColor: Colors.card, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  wordText: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.sun, letterSpacing: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  guessCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.cardBorder, ...Shadow.sm },
  guessTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm },
  guessRow: { flexDirection: 'row', gap: Spacing.sm },
  guessInput: { flex: 1, backgroundColor: Colors.boardLight, borderWidth: 1.5, borderColor: Colors.cardBorder, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.md, color: Colors.textPrimary },
  guessInputDisabled: { opacity: 0.5 },
  sendBtn: { backgroundColor: Colors.teal, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontWeight: '800', fontSize: FontSize.sm },
  msgText: { marginTop: Spacing.xs, fontSize: FontSize.sm, fontWeight: '700' },
  msgOk: { color: Colors.teal },
  msgBad: { color: Colors.error },
  playerCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.cardBorder },
  playerTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm },
  playerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.boardLight },
  playerRowMe: { backgroundColor: Colors.drawerBg, paddingHorizontal: Spacing.sm, borderRadius: Radius.sm, borderBottomWidth: 0, marginBottom: 2 },
  playerRowDrawer: { backgroundColor: Colors.drawerBg, paddingHorizontal: Spacing.sm, borderRadius: Radius.sm, borderBottomWidth: 0, marginBottom: 2 },
  playerRowOff: { opacity: 0.4 },
  playerName: { color: Colors.textPrimary, fontWeight: '700', fontSize: FontSize.sm },
  playerNameDrawer: { color: Colors.teal },
  playerScore: { color: Colors.textSecondary, fontWeight: '700', fontSize: FontSize.sm },
});
