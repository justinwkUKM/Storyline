import shieldLock from '../assets/executive/shield-lock.svg';
import serverHsm from '../assets/executive/server-hsm.svg';
import certificate from '../assets/executive/certificate.svg';
import networkNodes from '../assets/executive/network-nodes.svg';
import roadmapCalendar from '../assets/executive/roadmap-calendar.svg';
import collaboration from '../assets/executive/collaboration.svg';
import target from '../assets/executive/target.svg';
import dependencyPuzzle from '../assets/executive/dependency-puzzle.svg';
import targetStrategy from '../assets/executive/target-strategy.svg';
import dataDashboard from '../assets/executive/data-dashboard.svg';
import regulatoryBuilding from '../assets/executive/regulatory-building.svg';
import clipboardAssessment from '../assets/executive/clipboard-assessment.svg';
import cloudInfrastructure from '../assets/executive/cloud-infrastructure.svg';
import collaborationCircle from '../assets/executive/collaboration-circle.svg';

export const EXECUTIVE_ASSET_MAP: Record<string, string> = {
  'shield-lock': shieldLock,
  'server-hsm': serverHsm,
  certificate,
  'network-nodes': networkNodes,
  'roadmap-calendar': roadmapCalendar,
  collaboration,
  'collaboration-circle': collaborationCircle,
  target,
  'target-strategy': targetStrategy,
  'dependency-puzzle': dependencyPuzzle,
  'data-dashboard': dataDashboard,
  'regulatory-building': regulatoryBuilding,
  'clipboard-assessment': clipboardAssessment,
  'cloud-infrastructure': cloudInfrastructure,
};

export function getExecutiveAssetUrl(key?: string) {
  return key ? EXECUTIVE_ASSET_MAP[key] : undefined;
}
