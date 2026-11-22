import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Clipboard,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../theme';
import { useGame } from '../context/GameContext';
import { Player } from '../context/GameContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Lobby'>;
};

export default function LobbyScreen({ navigation }: Props) {
  const { state, myId, startGame, disconnect } = useGame();

  useEffect(() => {
    if (!state) return;
    if (state.phase === 'playing' || state.phase === 'roundEnd') navigation.replace('Game');
  }, [state?.phase]);

  if (!state) return null;

  const isHost = state.hostId === myId;
  const count = state.players.length;
  const canStart = count >= 2;

  const handleCopy = () => {
    Clipboard.setString(state.roomId);
    Alert.alert('Copied!', `Room code ${state.roomId} copied to clipboard.`);
  };

  const renderPlayer = ({ item }: { item: Player }) => {
    const isMe = item.id === myId;
    const isHost = item.id === state.hostId;
    return (
      <View style={[styles.playerItem, isMe && styles.playerMe]}>
        <Text style={[styles.playerName, isMe && styles.playerNameMe]}>{item.name}</Text>
        {isHost && <View style={styles.hostBadge}><Text style={styles.hostBadgeText}>HOST</Text></View>}
        {isMe && !isHost && <View style={styles.meBadge}><Text style={styles.meBadgeText}>YOU</Text></View>}
      </View>
    );
  };

  // Fill empty seats
  const slots = [...state.players];
  for (let i = count; i < state.max; i++) {
    slots.push({ id: `slot-${i}`, name: 'Open seat', score: 0, connected: false, guessed: false });
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Waiting Room</Text>
        <TouchableOpacity style={styles.leaveBtn} onPress={async () => { await disconnect(); navigation.replace('Home'); }}>
          <Text style={styles.leaveText}>Leave</Text>
        </TouchableOpacity>
      </View>

      {/* Room Code Card */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Room Code</Text>
        <Text style={styles.codeText}>{state.roomId}</Text>
        <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
          <Text style={styles.copyBtnText}>📋 Copy Code</Text>
        </TouchableOpacity>
      </View>

      {/* Players count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          <Text style={styles.countNum}>{count}</Text>
          <Text style={styles.countMax}> / {state.max} players</Text>
        </Text>
        <Text style={styles.statusText}>
          {!canStart ? '⏳ Need at least 2 players' : isHost ? '✅ Ready to start!' : '⏳ Waiting for host…'}
        </Text>
      </View>

      {/* Player list */}
      <FlatList
        data={slots}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const isOpen = item.id.startsWith('slot-');
          return (
            <View style={[styles.playerItem, isOpen && styles.playerSlot, item.id === myId && styles.playerMe]}>
              <Text style={[styles.playerName, isOpen && styles.playerSlotText, item.id === myId && styles.playerNameMe]}>
                {item.name}
              </Text>
              {item.id === state.hostId && <View style={styles.hostBadge}><Text style={styles.hostBadgeText}>HOST</Text></View>}
              {item.id === myId && item.id !== state.hostId && <View style={styles.meBadge}><Text style={styles.meBadgeText}>YOU</Text></View>}
            </View>
          );
        }}
        style={styles.list}
        contentContainerStyle={{ gap: Spacing.sm, paddingBottom: Spacing.xxxl }}
        numColumns={2}
        columnWrapperStyle={{ gap: Spacing.sm }}
      />

      {/* Start button (host only) */}
      {isHost && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
            onPress={startGame}
            disabled={!canStart}
          >
            <Text style={styles.startBtnText}>
              {canStart ? '🎮 Start Game!' : `Need ${2 - count} more player${2 - count !== 1 ? 's' : ''}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.board, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.1 },
  blob1: { width: 250, height: 250, backgroundColor: Colors.purple, top: -60, right: -60 },
  blob2: { width: 200, height: 200, backgroundColor: Colors.teal, bottom: 100, left: -50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl + 10, paddingBottom: Spacing.md },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.textPrimary },
  leaveBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  leaveText: { color: Colors.error, fontSize: FontSize.sm, fontWeight: '700' },
  codeCard: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  codeLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 2, marginBottom: Spacing.xs },
  codeText: { fontSize: 48, fontWeight: '900', color: Colors.teal, letterSpacing: 8, marginBottom: Spacing.md },
  copyBtn: { backgroundColor: Colors.boardLight, borderRadius: Radius.full, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderWidth: 1, borderColor: Colors.cardBorder },
  copyBtnText: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700' },
  countRow: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  countText: { fontSize: FontSize.md, marginBottom: Spacing.xs },
  countNum: { color: Colors.teal, fontWeight: '900', fontSize: FontSize.xl },
  countMax: { color: Colors.textSecondary },
  statusText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  list: { flex: 1, paddingHorizontal: Spacing.xl },
  playerItem: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    minHeight: 52,
  },
  playerMe: { borderColor: Colors.teal, backgroundColor: Colors.drawerBg },
  playerSlot: { borderStyle: 'dashed', opacity: 0.4 },
  playerName: { color: Colors.textPrimary, fontWeight: '700', fontSize: FontSize.sm, flexShrink: 1 },
  playerNameMe: { color: Colors.teal },
  playerSlotText: { color: Colors.textMuted, fontStyle: 'italic' },
  hostBadge: { backgroundColor: Colors.sun, borderRadius: Radius.full, paddingHorizontal: Spacing.xs, paddingVertical: 2 },
  hostBadgeText: { fontSize: 9, fontWeight: '900', color: Colors.ink },
  meBadge: { backgroundColor: Colors.teal, borderRadius: Radius.full, paddingHorizontal: Spacing.xs, paddingVertical: 2 },
  meBadgeText: { fontSize: 9, fontWeight: '900', color: '#fff' },
  footer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl, paddingTop: Spacing.md },
  startBtn: { backgroundColor: Colors.teal, borderRadius: Radius.lg, paddingVertical: Spacing.lg, alignItems: 'center', ...Shadow.md },
  startBtnDisabled: { opacity: 0.4 },
  startBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '900' },
});
