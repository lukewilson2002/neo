export interface NeoConfig {
  services: ServiceConfig
  hooks: HookConfig
}

export interface ServiceConfig {
  postgres: string | boolean
  redis: string | boolean
  s3: boolean
}

export interface HookConfig {
  up?: string
}

export interface ResolvedConfig {
  services: {
    postgres: { enabled: boolean; version: string }
    redis: { enabled: boolean; version: string }
    s3: { enabled: boolean }
  }
  hooks: HookConfig
}

export interface AllocatedPorts {
  postgres?: number
  redis?: number
  s3?: number
  s3Console?: number
}

export interface EnvironmentState {
  name: string
  ports: AllocatedPorts
  services: string[]
  startedAt: string
  projectId: string
}

export interface ProjectState {
  environments: EnvironmentState[]
}
