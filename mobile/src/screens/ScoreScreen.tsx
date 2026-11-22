import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../theme';
import { useGame } from '../context/GameContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Score'>;
};

export default function ScoreScreen({ navigation }: Props) {
  const { state, myId } = useGame();
  const [countdown, setCountdown] = useState(7);
  const endAtRef = useRef(0);

  useEffect(() => {
    if (!state) return;
    if (state.phase === 'playing') navigation.replace('Game');
    if (state.phase === 'final') navigation.replace('Final');
    if (state.phase === 'lobby') navigation.replace('Lobby');
    endAtRef.current = Date.now() + state.remaining;
  }, [state?.phase, state?.remaining]);

  useEffect(() => {
    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setCountdown(left);
    }, 250);
    return () => clearInterval(interval);
  }, []);

  if (!state || !state.last) return null;
  const { last } = state;

  const ranked = [...state.players].sort((a, b) => b.score - a.score);
  const maxScore = ranked[0]?.score ?? 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={[styles.blob, styles.blob1]} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.roundLabel}>Round {last.round} of {state.totalRounds}</Text>
        <Text style={styles.title}>Round Results</Text>

        {/* Word reveal */}
        <View style={styles.wordCard}>
          <Text style={styles.wordLabel}>The word was</Text>
          <Text style={styles.word}>"{last.word}"</Text>
          <Text style={styles.drawerInfo}>
            {last.correctNames.length
              ? `✅ Guessed by: ${last.correctNames.join(', ')}`
              : '❌ Nobody guessed it'}
          </Text>
          <Text style={[styles.drawerDelta, last.drawerDelta > 0 ? styles.deltaBad : styles.deltaGood]}>
            {last.drawerName} (drawer): {last.drawerDelta > 0 ? '+1' : '−1'} point
          </Text>
        </View>

        {/* Leaderboard */}
        <View style={styles.rankCard}>
          <Text style={styles.rankTitle}>📊 Leaderboard</Text>
          {ranked.map((p, i) => {
            const isTop = p.score === maxScore;
            const isMe = p.id === myId;
            return (
              <View key={p.id} style={[styles.rankRow, isTop && styles.rankRowTop, isMe && styles.rankRowMe]}>
                <Text style={[styles.rankNum, isTop && styles.rankNumTop]}>#{i + 1}</Text>
                <Text style={[styles.rankName, isMe && styles.rankNameMe]}>{p.name}{isMe ? ' (you)' : ''}</Text>
                <Text style={[styles.rankScore, isTop && styles.rankScoreTop]}>{p.score}</Text>
              </View>
            );
          })}
        </View>

        {/* Countdown */}
        <Text style={styles.next}>Next round in <Text style={styles.nextNum}>{countdown}s</Text></Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.board, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.1 },
  blob1: { width: 300, height: 300, backgroundColor: Colors.purple, top: -60, right: -60 },
  scroll: { padding: Spacing.xl, paddingTop: Spacing.xxxl, gap: Spacing.lg },
  roundLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 2, marginBottom: -Spacing.sm },
  title: { fontSize: FontSize.xxxl, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -1 },
  wordCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: Spacing.xs,
    ...Shadow.md,
  },
  wordLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  word: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.sun, letterSpacing: 2 },
  drawerInfo: { fontSize: FontSize.md, color: Colors.textPrimary, marginTop: Spacing.xs },
  drawerDelta: { fontSize: FontSize.sm, fontWeight: '700', marginTop: 2 },
  deltaBad: { color: Colors.error },
  deltaGood: { color: Colors.teal },
  rankCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.sm,
  },
  rankTitle: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.textPrimary, marginBottom: Spacing.md },
  rankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.boardLight, gap: Spacing.md },
  rankRowTop: { backgroundColor: Colors.sunDark + '22', borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, borderBottomWidth: 0, marginBottom: 2 },
  rankRowMe: { borderColor: Colors.teal },
  rankNum: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: '700', width: 30 },
  rankNumTop: { color: Colors.sun },
  rankName: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '700' },
  rankNameMe: { color: Colors.teal },
  rankScore: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.textPrimary },
  rankScoreTop: { color: Colors.sun },
  next: { textAlign: 'center', fontSize: FontSize.md, color: Colors.textSecondary },
  nextNum: { color: Colors.teal, fontWeight: '900', fontSize: FontSize.xl },
});
