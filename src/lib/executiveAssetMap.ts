import shieldLock from '../assets/executive/shield-lock.svg';
import serverHsm from '../assets/executive/server-hsm.svg';
import certificate from '../assets/executive/certificate.svg';
import networkNodes from '../assets/executive/network-nodes.svg';
import roadmapCalendar from '../assets/executive/roadmap-calendar.svg';
import collaboration from '../assets/executive/collaboration.svg';
import target from '../assets/executive/target.svg';

export const EXECUTIVE_ASSET_MAP: Record<string, string> = {
  'shield-lock': shieldLock,
  'server-hsm': serverHsm,
  certificate,
  'network-nodes': networkNodes,
  'roadmap-calendar': roadmapCalendar,
  collaboration,
  target,
};

export function getExecutiveAssetUrl(key?: string) {
  return key ? EXECUTIVE_ASSET_MAP[key] : undefined;
}
