import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: Props) {
  const createAnim = useRef(new Animated.Value(1)).current;
  const joinAnim = useRef(new Animated.Value(1)).current;

  const press = (anim: Animated.Value, onDone: () => void) => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(onDone);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background blobs */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />
      <View style={[styles.blob, styles.blob3]} />

      <View style={styles.content}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          <Text style={styles.emoji}>🎨</Text>
          <Text style={styles.title}>Draw &{'\n'}Guess</Text>
          <Text style={styles.subtitle}>Real-time multiplayer drawing game</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <Animated.View style={{ transform: [{ scale: createAnim }] }}>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              activeOpacity={1}
              onPress={() => press(createAnim, () => navigation.navigate('CreateRoom'))}
            >
              <Text style={styles.btnIcon}>✏️</Text>
              <Text style={[styles.btnText, styles.btnTextPrimary]}>Create a Room</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: joinAnim }] }}>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              activeOpacity={1}
              onPress={() => press(joinAnim, () => navigation.navigate('JoinRoom'))}
            >
              <Text style={styles.btnIcon}>🚀</Text>
              <Text style={[styles.btnText, styles.btnTextSecondary]}>Join a Room</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Text style={styles.hint}>2–11 players · Everyone draws once</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.board,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.15,
  },
  blob1: {
    width: 320,
    height: 320,
    backgroundColor: Colors.teal,
    top: -80,
    right: -100,
  },
  blob2: {
    width: 250,
    height: 250,
    backgroundColor: Colors.pink,
    bottom: 100,
    left: -80,
  },
  blob3: {
    width: 180,
    height: 180,
    backgroundColor: Colors.purple,
    top: '45%',
    right: -40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  emoji: {
    fontSize: 72,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.huge,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: FontSize.huge * 1.0,
    letterSpacing: -2,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  buttons: {
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    width: '100%',
    ...Shadow.md,
  },
  btnPrimary: {
    backgroundColor: Colors.teal,
  },
  btnSecondary: {
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  btnIcon: {
    fontSize: 20,
  },
  btnText: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  btnTextPrimary: {
    color: '#fff',
  },
  btnTextSecondary: {
    color: Colors.textPrimary,
  },
  hint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
