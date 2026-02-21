import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';

// Map Material Symbols (web) names to MaterialIcons (RN) names
const iconMap: Record<string, string> = {
  arrow_back: 'arrow-back',
  auto_awesome: 'auto-awesome',
  calendar_month: 'calendar-month',
  sync_alt: 'sync-alt',
  check_circle: 'check-circle',
  open_in_new: 'open-in-new',
  add_circle: 'add-circle',
  remove_circle: 'remove-circle',
  play_circle: 'play-circle',
  magic_button: 'auto-fix-high',
  format_quote: 'format-quote',
  local_cafe: 'local-cafe',
  directions_walk: 'directions-walk',
  verified_user: 'verified-user',
  workspace_premium: 'workspace-premium',
  monetization_on: 'monetization-on',
  chevron_right: 'chevron-right',
};

function getMappedName(name: string): string {
  if (iconMap[name]) return iconMap[name];
  return name.replace(/_/g, '-');
}

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#fff', style }) => {
  return (
    <MaterialIcons
      name={getMappedName(name) as any}
      size={size}
      color={color}
      style={style}
    />
  );
};

export default Icon;
