/**
 * Route constants and path helpers for URL-based navigation
 */

// Route paths as constants
export const ROUTES = {
  DASHBOARD: '/',
  TOPOLOGIES: '/topologies',
  TOPOLOGY_DETAIL: '/topologies/:id',
  RESOURCES: '/resources',
  RESOURCE_DETAIL: '/resources/:id',
  AGENTS: '/agents',
  AGENTS_PROMPTS: '/agents/prompts',
  AGENTS_MODELS: '/agents/models',
  AGENTS_TOOLS: '/agents/tools',
  REPORTS: '/reports',
  REPORT_DETAIL: '/reports/:id',
  REPORT_TEMPLATES: '/reports/templates',
  DISCOVERY: '/discovery',
  SCANNER: '/scanner',
  DIAGNOSIS: '/diagnosis',
} as const;

// Helper to generate paths with parameters
export const paths = {
  topologyDetail: (id: string | number) => `/topologies/${id}`,
  resourceDetail: (id: string | number) => `/resources/${id}`,
  reportDetail: (id: string) => `/reports/${id}`,
};

// Navigation item configuration for sidebar
export interface NavItem {
  id: string;
  path: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', path: ROUTES.DASHBOARD, label: 'Dashboard', icon: 'Home' },
  { id: 'topologies', path: ROUTES.TOPOLOGIES, label: 'Topologies', icon: 'Network' },
  { id: 'resources', path: ROUTES.RESOURCES, label: 'Resources', icon: 'Server' },
  { id: 'agents', path: ROUTES.AGENTS, label: 'Agents', icon: 'Users' },
  { id: 'reports', path: ROUTES.REPORTS, label: 'Reports', icon: 'FileText' },
  { id: 'discovery', path: ROUTES.DISCOVERY, label: 'Discovery', icon: 'Search' },
  { id: 'scanner', path: ROUTES.SCANNER, label: 'Scanner', icon: 'Scan' },
  { id: 'diagnosis', path: ROUTES.DIAGNOSIS, label: 'Diagnosis', icon: 'Activity' },
];
