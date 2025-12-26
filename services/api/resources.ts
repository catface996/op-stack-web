/**
 * Resource API Service
 *
 * Encapsulates all resource management API calls
 * Feature: 001-resource-api-integration
 */

import {
  Server,
  Database,
  Shield,
  Activity,
  Cpu,
  Box,
  Cloud,
  HardDrive,
  Network,
  Globe,
  Container,
  Layers,
  MonitorSmartphone,
  Radio,
  Wifi,
  Router,
  type LucideIcon
} from 'lucide-react';
import type { IconType } from 'react-icons';
import {
  SiMysql,
  SiPostgresql,
  SiMongodb,
  SiRedis,
  SiApachekafka,
  SiRabbitmq,
  SiElasticsearch,
  SiNginx,
  SiDocker,
  SiKubernetes,
  SiApacherocketmq,
  SiConsul,
  SiPrometheus,
  SiGrafana,
  SiJenkins,
  SiAmazonwebservices,
  SiGooglecloud,
  SiApache,
  SiOracle,
  SiMariadb,
  SiSqlite,
  SiClickhouse,
  SiMinio,
  SiVault,
  SiTerraform,
  SiAnsible,
  SiGitlab,
  SiGithub,
  SiEtcd,
  SiIstio,
  SiLinkerd,
  SiEnvoyproxy,
  SiTraefikproxy,
  SiCaddy,
  SiOpentelemetry,
  SiFluentd,
  SiLogstash,
  SiKibana,
  SiJaeger,
  SiSentry,
  SiDatadog,
  SiNewrelic,
  SiPagerduty,
  SiApachepulsar,
  SiCouchbase,
  SiApachecassandra,
  SiNeo4J,
  SiInfluxdb,
  SiTimescale
} from 'react-icons/si';
import { FaMicrosoft } from 'react-icons/fa';
import { apiPost } from './client';
import type {
  ListResourcesRequest,
  CreateResourceRequest,
  UpdateResourceRequest,
  UpdateResourceStatusRequest,
  DeleteResourceRequest,
  QueryAuditLogsRequest,
  QueryResourceTypesRequest,
  ResourceDTO,
  ResourceTypeDTO,
  ResourceAuditLogDTO,
  PageResult,
} from './types';

// ============================================================================
// API Endpoints
// NOTE: Resource CRUD endpoints are deprecated in favor of Node API (Feature: 005-api-reintegration)
// The hooks now use nodeApi internally for backward compatibility
// These endpoints are kept for reference and audit log functionality
// ============================================================================

/**
 * @deprecated Most endpoints replaced by nodeApi (Feature: 005-api-reintegration)
 * - RESOURCES_QUERY → nodeApi.query()
 * - RESOURCES_CREATE → nodeApi.create()
 * - RESOURCES_GET → nodeApi.get()
 * - RESOURCES_UPDATE → nodeApi.update()
 * - RESOURCES_DELETE → nodeApi.delete()
 * - RESOURCE_TYPES_QUERY → nodeApi.getTypes()
 * - RESOURCES_UPDATE_STATUS: Still in use (no node equivalent yet)
 * - AUDIT_LOGS_QUERY: Still in use (no node equivalent yet)
 */
const ENDPOINTS = {
  /** @deprecated Use nodeApi.query() instead */
  RESOURCES_QUERY: '/api/v1/resources/query',
  /** @deprecated Use nodeApi.create() instead */
  RESOURCES_CREATE: '/api/v1/resources/create',
  /** @deprecated Use nodeApi.get() instead */
  RESOURCES_GET: '/api/v1/resources/get',
  /** @deprecated Use nodeApi.update() instead */
  RESOURCES_UPDATE: '/api/v1/resources/update',
  /** @deprecated Use nodeApi.delete() instead */
  RESOURCES_DELETE: '/api/v1/resources/delete',
  // Still in use - no node equivalent
  RESOURCES_UPDATE_STATUS: '/api/v1/resources/update-status',
  /** @deprecated Use nodeApi.getTypes() instead */
  RESOURCE_TYPES_QUERY: '/api/v1/resource-types/query',
  // Still in use - no node equivalent
  AUDIT_LOGS_QUERY: '/api/v1/resources/audit-logs/query',
} as const;

// ============================================================================
// Resource API
// ============================================================================

export const resourceApi = {
  /**
   * Query resource list
   */
  list: (params: ListResourcesRequest): Promise<PageResult<ResourceDTO>> =>
    apiPost<ListResourcesRequest, PageResult<ResourceDTO>>(
      ENDPOINTS.RESOURCES_QUERY,
      params
    ),

  /**
   * Create resource
   */
  create: (data: CreateResourceRequest): Promise<ResourceDTO> =>
    apiPost<CreateResourceRequest, ResourceDTO>(
      ENDPOINTS.RESOURCES_CREATE,
      data
    ),

  /**
   * Get single resource details
   */
  get: (id: number): Promise<ResourceDTO> =>
    apiPost<{ id: number }, ResourceDTO>(
      ENDPOINTS.RESOURCES_GET,
      { id }
    ),

  /**
   * Update resource
   */
  update: (data: UpdateResourceRequest): Promise<ResourceDTO> =>
    apiPost<UpdateResourceRequest, ResourceDTO>(
      ENDPOINTS.RESOURCES_UPDATE,
      data
    ),

  /**
   * Delete resource
   */
  delete: (id: number, confirmName: string): Promise<void> =>
    apiPost<DeleteResourceRequest, void>(
      ENDPOINTS.RESOURCES_DELETE,
      { id, confirmName }
    ),

  /**
   * Update resource status
   */
  updateStatus: (data: UpdateResourceStatusRequest): Promise<ResourceDTO> =>
    apiPost<UpdateResourceStatusRequest, ResourceDTO>(
      ENDPOINTS.RESOURCES_UPDATE_STATUS,
      data
    ),

  /**
   * Query resource type list
   */
  getTypes: (params: QueryResourceTypesRequest = {}): Promise<ResourceTypeDTO[]> =>
    apiPost<QueryResourceTypesRequest, ResourceTypeDTO[]>(
      ENDPOINTS.RESOURCE_TYPES_QUERY,
      params
    ),

  /**
   * Query resource audit logs
   */
  getAuditLogs: (params: QueryAuditLogsRequest): Promise<PageResult<ResourceAuditLogDTO>> =>
    apiPost<QueryAuditLogsRequest, PageResult<ResourceAuditLogDTO>>(
      ENDPOINTS.AUDIT_LOGS_QUERY,
      params
    ),
};

// ============================================================================
// Resource Type Icon Mapping
// ============================================================================

// Combined icon type for both Lucide and React Icons
export type ResourceIcon = LucideIcon | IconType;

/**
 * Brand icon mapping - specific technology icons
 */
export const BRAND_ICONS: Record<string, IconType> = {
  // Databases
  mysql: SiMysql,
  postgres: SiPostgresql,
  postgresql: SiPostgresql,
  mongodb: SiMongodb,
  mongo: SiMongodb,
  oracle: SiOracle,
  mariadb: SiMariadb,
  sqlite: SiSqlite,
  clickhouse: SiClickhouse,
  couchbase: SiCouchbase,
  cassandra: SiApachecassandra,
  neo4j: SiNeo4J,
  influxdb: SiInfluxdb,
  timescale: SiTimescale,

  // Cache
  redis: SiRedis,

  // Message Queues
  kafka: SiApachekafka,
  rabbitmq: SiRabbitmq,
  rocketmq: SiApacherocketmq,
  pulsar: SiApachepulsar,

  // Search & Analytics
  elasticsearch: SiElasticsearch,
  elastic: SiElasticsearch,
  kibana: SiKibana,
  logstash: SiLogstash,
  fluentd: SiFluentd,

  // Service Discovery & Config
  consul: SiConsul,
  zookeeper: SiApache, // Use Apache icon
  etcd: SiEtcd,
  nacos: SiApache, // Use Apache icon for Nacos

  // Gateway & Proxy
  nginx: SiNginx,
  envoy: SiEnvoyproxy,
  traefik: SiTraefikproxy,
  caddy: SiCaddy,
  istio: SiIstio,
  linkerd: SiLinkerd,

  // Container & Orchestration
  docker: SiDocker,
  kubernetes: SiKubernetes,
  k8s: SiKubernetes,

  // Cloud Providers
  aws: SiAmazonwebservices,
  azure: FaMicrosoft,
  gcp: SiGooglecloud,
  googlecloud: SiGooglecloud,

  // Monitoring & Observability
  prometheus: SiPrometheus,
  grafana: SiGrafana,
  jaeger: SiJaeger,
  opentelemetry: SiOpentelemetry,
  sentry: SiSentry,
  datadog: SiDatadog,
  newrelic: SiNewrelic,
  pagerduty: SiPagerduty,

  // CI/CD & DevOps
  jenkins: SiJenkins,
  gitlab: SiGitlab,
  github: SiGithub,
  terraform: SiTerraform,
  ansible: SiAnsible,
  vault: SiVault,

  // Storage
  minio: SiMinio,

  // Application Servers
  apache: SiApache,
};

/**
 * Generic icon mapping (fallback)
 */
export const GENERIC_ICONS: Record<string, LucideIcon> = {
  server: Server,
  service: Server,
  database: Database,
  db: Database,
  gateway: Shield,
  cache: Activity,
  infrastructure: Cpu,
  cloud: Cloud,
  storage: HardDrive,
  network: Network,
  loadbalancer: Router,
  lb: Router,
  container: Container,
  application: MonitorSmartphone,
  app: MonitorSmartphone,
  mq: Radio,
  queue: Radio,
  middleware: Layers,
  web: Globe,
  http: Globe,
  api: Server,
  registry: Network,
  config: Network,
};

/**
 * Default icon
 */
export const DEFAULT_RESOURCE_ICON: LucideIcon = Box;

/**
 * Get icon component by resource type code or name
 * Returns brand-specific icons when possible, falls back to generic icons
 */
export function getResourceTypeIcon(typeCode: string | undefined | null, resourceName?: string): ResourceIcon {
  const searchTerms: string[] = [];

  if (typeCode) searchTerms.push(typeCode.toLowerCase());
  if (resourceName) searchTerms.push(resourceName.toLowerCase());

  // Search for brand icons first
  for (const term of searchTerms) {
    for (const [key, icon] of Object.entries(BRAND_ICONS)) {
      if (term.includes(key)) {
        return icon;
      }
    }
  }

  // Fall back to generic icons
  for (const term of searchTerms) {
    for (const [key, icon] of Object.entries(GENERIC_ICONS)) {
      if (term.includes(key)) {
        return icon;
      }
    }
  }

  return DEFAULT_RESOURCE_ICON;
}

// ============================================================================
// Status Display Configuration
// ============================================================================

import type { ResourceStatus } from './types';

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
}

/**
 * Status display configuration
 */
export const STATUS_CONFIG: Record<ResourceStatus, StatusConfig> = {
  RUNNING: {
    label: 'Running',
    color: 'text-green-500',
    bgColor: 'bg-green-950/20',
  },
  STOPPED: {
    label: 'Stopped',
    color: 'text-slate-500',
    bgColor: 'bg-slate-800/30',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-950/20',
  },
  OFFLINE: {
    label: 'Offline',
    color: 'text-red-500',
    bgColor: 'bg-red-950/20',
  },
};

/**
 * Get status display configuration
 */
export function getStatusConfig(status: ResourceStatus): StatusConfig {
  return STATUS_CONFIG[status] || STATUS_CONFIG.OFFLINE;
}
