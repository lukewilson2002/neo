import { stringify } from "yaml"
import {
  DEFAULT_DB_NAME,
  DEFAULT_DB_USER,
  DEFAULT_DB_PASSWORD,
} from "../constants"
import type { ResolvedConfig, AllocatedPorts } from "../types"

export interface ComposeSpec {
  services: Record<string, ComposeService>
  volumes: Record<string, object>
}

export interface ComposeService {
  image: string
  ports: string[]
  environment?: Record<string, string>
  healthcheck: {
    test: string | string[]
    interval: string
    timeout: string
    retries: number
  }
  volumes?: string[]
  command?: string
  restart: string
}

export function buildComposeSpec(
  config: ResolvedConfig,
  ports: AllocatedPorts
): ComposeSpec {
  const services: Record<string, ComposeService> = {}
  const volumes: Record<string, object> = {}

  if (config.services.postgres.enabled && ports.postgres) {
    services.postgres = {
      image: `postgres:${config.services.postgres.version}`,
      ports: [`${ports.postgres}:5432`],
      environment: {
        POSTGRES_DB: DEFAULT_DB_NAME,
        POSTGRES_USER: DEFAULT_DB_USER,
        POSTGRES_PASSWORD: DEFAULT_DB_PASSWORD,
      },
      healthcheck: {
        test: ["CMD-SHELL", `pg_isready -U ${DEFAULT_DB_USER}`],
        interval: "2s",
        timeout: "5s",
        retries: 10,
      },
      volumes: ["postgres_data:/var/lib/postgresql/data"],
      restart: "unless-stopped",
    }
    volumes.postgres_data = {}
  }

  if (config.services.redis.enabled && ports.redis) {
    services.redis = {
      image: `redis:${config.services.redis.version}`,
      ports: [`${ports.redis}:6379`],
      healthcheck: {
        test: ["CMD", "redis-cli", "ping"],
        interval: "2s",
        timeout: "5s",
        retries: 10,
      },
      restart: "unless-stopped",
    }
  }

  if (config.services.s3.enabled && ports.s3 && ports.s3Console) {
    services.minio = {
      image: "minio/minio",
      ports: [`${ports.s3}:9000`, `${ports.s3Console}:9001`],
      environment: {
        MINIO_ROOT_USER: "minioadmin",
        MINIO_ROOT_PASSWORD: "minioadmin",
      },
      command: "server /data --console-address :9001",
      healthcheck: {
        test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"],
        interval: "2s",
        timeout: "5s",
        retries: 10,
      },
      volumes: ["minio_data:/data"],
      restart: "unless-stopped",
    }
    volumes.minio_data = {}
  }

  return { services, volumes }
}

export function serializeCompose(spec: ComposeSpec): string {
  return stringify(spec)
}
