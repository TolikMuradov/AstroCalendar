import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../services/firebase';
import Icon from '../components/Icon';
import CosmicLoader from '../components/CosmicLoader';
import { colors, glassPanel } from '../styles/theme';
import Constants from 'expo-constants';

interface SignInProps {
  onBack: () => void;
}

const SignInScreen: React.FC<SignInProps> = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const webClientId = Constants.expoConfig?.extra?.googleWebClientId || '';

  useEffect(() => {
    if (webClientId) {
      GoogleSignin.configure({
        webClientId,
        offlineAccess: false,
      });
    }
  }, [webClientId]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken || (userInfo as any).idToken;

      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      } else {
        throw new Error('No ID token returned from Google.');
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        setError('Sign-in cancelled.');
      } else if (err.code === statusCodes.IN_PROGRESS) {
        setError('Sign-in already in progress.');
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Play services not available or outdated.');
      } else {
        setError('Celestial connection interrupted. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0a0202', '#1a0808']} style={styles.container}>
      {/* Back button */}
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Icon name="arrow_back" size={24} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.center}>
          <View style={styles.iconCircle}>
            <Icon name="auto_awesome" size={48} color={colors.primary} />
          </View>
          <Text style={styles.title}>Sync your soul.</Text>
          <Text style={styles.subtitle}>Securely access your personal natal chart and daily cosmic insights.</Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Pressable
          disabled={isLoading}
          onPress={handleGoogleSignIn}
          style={[styles.googleBtn, isLoading && { opacity: 0.5 }]}
        >
          {isLoading ? (
            <CosmicLoader size="small" color="#fff" />
          ) : (
            <>
              <Text style={{ fontSize: 20 }}>G</Text>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </>
          )}
        </Pressable>

        <View style={styles.securityRow}>
          <Icon name="verified_user" size={16} color="rgba(243,198,35,0.4)" />
          <Text style={styles.securityText}>End-to-End Soul Encryption</Text>
        </View>

        <Text style={styles.poweredText}>
          Powered by <Text style={{ color: 'rgba(243,198,35,0.5)', fontWeight: 'bold' }}>916.studio</Text>
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', padding: 24 },
  backBtn: { width: 48, height: 48, borderRadius: 24, ...glassPanel, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32, gap: 24 },
  center: { alignItems: 'center', marginBottom: 32 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, ...glassPanel, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  title: { color: '#fff', fontSize: 36, fontWeight: 'bold', fontStyle: 'italic', marginBottom: 16, textAlign: 'center' },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', maxWidth: 280, lineHeight: 22 },
  errorBox: { ...glassPanel, backgroundColor: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)', borderRadius: 16, padding: 16, alignItems: 'center' },
  errorText: { color: '#f87171', fontSize: 12, fontWeight: '500' },
  googleBtn: { ...glassPanel, height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  googleBtnText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500' },
  securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 24 },
  securityText: { color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2 },
  poweredText: { color: 'rgba(255,255,255,0.2)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginTop: 16 },
});

export default SignInScreen;
