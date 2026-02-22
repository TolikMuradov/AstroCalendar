import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#8e0505',
  accentGold: '#f3c623',
  backgroundDark: '#0a0202',
  panelDark: '#1d0808',
  white: '#ffffff',
};

export const glassPanel = {
  backgroundColor: 'rgba(255,255,255,0.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
};

export const sharedStyles = StyleSheet.create({
  glassPanel: {
    ...glassPanel,
    borderRadius: 16,
  },
  glassPanelLg: {
    ...glassPanel,
    borderRadius: 32,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
