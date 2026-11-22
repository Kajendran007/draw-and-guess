import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../theme';
import { useGame } from '../context/GameContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Final'>;
};

export default function FinalScreen({ navigation }: Props) {
  const { state, myId, playAgain, disconnect } = useGame();

  useEffect(() => {
    if (!state) return;
    if (state.phase === 'lobby') navigation.replace('Lobby');
    if (state.phase === 'playing') navigation.replace('Game');
  }, [state?.phase]);

  if (!state || state.phase !== 'final') return null;

  const isHost = state.hostId === myId;
  const ranked = [...state.players].sort((a, b) => b.score - a.score);
  const maxScore = ranked[0]?.score ?? 0;
  const winners = ranked.filter(p => p.score === maxScore);
  const winnerText = winners.length > 1
    ? `🤝 Tie: ${winners.map(p => p.name).join(' & ')}`
    : `🏆 ${winners[0]?.name} wins!`;

  const trophies = ['🥇', '🥈', '🥉'];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />
      <View style={[styles.blob, styles.blob3]} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Winner banner */}
        <View style={styles.winnerBanner}>
          <Text style={styles.confetti}>🎉🎊🎉</Text>
          <Text style={styles.winnerText}>{winnerText}</Text>
          <Text style={styles.winnerScore}>{maxScore} point{maxScore !== 1 ? 's' : ''}</Text>
        </View>

        {/* Final leaderboard */}
        <View style={styles.rankCard}>
          <Text style={styles.rankTitle}>Final Standings</Text>
          {ranked.map((p, i) => {
            const isTop = p.score === maxScore;
            const isMe = p.id === myId;
            return (
              <View key={p.id} style={[styles.rankRow, isTop && styles.rankRowTop, isMe && styles.rankRowMe]}>
                <Text style={styles.trophy}>{trophies[i] ?? `#${i + 1}`}</Text>
                <Text style={[styles.rankName, isMe && styles.rankNameMe]}>
                  {p.name}{isMe ? ' (you)' : ''}
                </Text>
                <Text style={[styles.rankScore, isTop && styles.rankScoreTop]}>{p.score} pts</Text>
              </View>
            );
          })}
        </View>

        {/* Buttons */}
        {isHost ? (
          <TouchableOpacity style={styles.playAgainBtn} onPress={playAgain}>
            <Text style={styles.playAgainText}>🎮 Play Again</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.waitCard}>
            <Text style={styles.waitText}>⏳ Waiting for the host to start a new game…</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.leaveBtn}
          onPress={async () => { await disconnect(); navigation.replace('Home'); }}
        >
          <Text style={styles.leaveBtnText}>Leave Room</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.board, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 999 },
  blob1: { width: 300, height: 300, backgroundColor: Colors.teal, opacity: 0.1, top: -80, right: -60 },
  blob2: { width: 200, height: 200, backgroundColor: Colors.pink, opacity: 0.1, bottom: 100, left: -60 },
  blob3: { width: 160, height: 160, backgroundColor: Colors.sun, opacity: 0.08, top: '40%', left: '60%' },
  scroll: { padding: Spacing.xl, paddingTop: Spacing.xxxl, gap: Spacing.lg },
  winnerBanner: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.sun + '44',
    ...Shadow.lg,
  },
  confetti: { fontSize: 36, marginBottom: Spacing.sm },
  winnerText: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.textPrimary, textAlign: 'center', lineHeight: FontSize.xxl * 1.2 },
  winnerScore: { fontSize: FontSize.lg, color: Colors.sun, fontWeight: '800', marginTop: Spacing.sm },
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
  rankRowTop: { backgroundColor: Colors.sun + '22', borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, borderBottomWidth: 0, marginBottom: 2 },
  rankRowMe: { borderColor: Colors.teal },
  trophy: { fontSize: FontSize.lg, width: 36, textAlign: 'center' },
  rankName: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '700' },
  rankNameMe: { color: Colors.teal },
  rankScore: { fontSize: FontSize.md, fontWeight: '900', color: Colors.textPrimary },
  rankScoreTop: { color: Colors.sun },
  playAgainBtn: {
    backgroundColor: Colors.teal,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    ...Shadow.md,
  },
  playAgainText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '900' },
  waitCard: { backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.cardBorder },
  waitText: { color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center' },
  leaveBtn: { paddingVertical: Spacing.md, alignItems: 'center' },
  leaveBtnText: { color: Colors.error, fontSize: FontSize.md, fontWeight: '700' },
});
