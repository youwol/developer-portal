export type Label =
    | 'Label.DONE'
    | 'Label.INFO'
    | 'Label.STARTED'
    | 'Label.BASH'
    | 'Label.LOG_ABORT'
    | 'Label.EXCEPTION'
    | 'EnvironmentStatusResponse'
    | 'PipelineStepStatusResponse'
    | 'ProjectStatusResponse'
    | 'CdnResponse'
    | 'CheckUpdateResponse'
    | 'CheckUpdatesResponse'
    | 'Label.PACKAGE_DOWNLOADING'
    | 'DownloadedPackageResponse'
    | 'ProjectsLoadingResults'
    | 'Label.PIPELINE_STEP_STATUS_PENDING'
    | 'Label.PIPELINE_STEP_RUNNING'
    | 'Label.RUN_PIPELINE_STEP'
    | 'HelmPackage'

export interface ContextMessage<T = unknown> {
    contextId: string
    level: string
    text: string
    labels: Label[]
    parentContextId: string | undefined
    data: T
    attributes: { [key: string]: any }
}

export interface UserInfo {
    email: string
    name: string
    memberOf: Array<string>
}

export interface RemoteGateway {
    name: string
    host: string
}

export interface RemoteGatewayInfo {
    name: string
    host: string
    connected: boolean | undefined
}

export interface Link {
    name: string
    url: string
}

export interface ArtifactResponse {
    id: string
    path: string
    links: Link[]
}

export interface PipelineStep {
    id: string
    artifacts: ArtifactResponse[]
}

export type Status = 'OK' | 'KO' | 'Outdated' | 'none'

export interface ManifestResponse {
    fingerprint: string
    files: string[]
    cmdOutputs: string[]
}

export interface PipelineStepStatusResponse {
    projectId: string
    flowId: string
    stepId: string
    status: Status
    artifactFolder: string
    artifacts: ArtifactResponse[]
    manifest: ManifestResponse
}

export interface ChildToParentConnections {
    id: string
    parentIds: string[]
}

export interface DependenciesResponse {
    dag: ChildToParentConnections[]
    simpleDag: ChildToParentConnections[]
}

export interface ProjectStatusResponse {
    projectId: string
    workspaceDependencies: DependenciesResponse
}

export interface Flow {
    name: string
    dag: string[]
}

export interface Pipeline {
    id: string
    language: string
    compiler: string
    output: string
    steps: PipelineStep[]
    flows: Flow[]
}

export interface Project {
    id: string
    name: string
    version: string
    path: string[]
    pipeline: Pipeline
}

export interface Environment {
    userInfo: UserInfo
    users: Array<string>
    configuration: {
        available_profiles: string[]
        active_profile: string
        projects: Project[]
        pathsBook: {
            config: string
        }
    }
    remoteGatewayInfo: RemoteGatewayInfo
    remotesInfo: Array<RemoteGatewayInfo>
}

export interface ProjectLoadingFailure {
    path: string
    failure: string
    message: string
}

export function projectLoadingIsSuccess(
    result: ProjectLoadingResult,
): result is Project {
    return result['failure'] === undefined
}

export type ProjectLoadingResult = Project | ProjectLoadingFailure

export interface ProjectsLoadingResults {
    results: ProjectLoadingResult[]
}

export interface ConfigurationError {
    reason: string
    hints: Array<string>
}

export interface Check {
    name: string
    status: boolean | undefined | ConfigurationError
}

export interface LoadingStatus {
    validated: boolean
    path: string
    checks: Array<Check>
}

export interface TreeItem {
    name: string
    itemId: string
    group: string
    borrowed: boolean
    rawId: string
}

export interface CdnVersionResponse {
    name: string
    version: string
    versionNumber: number
    filesCount: number
    bundleSize: number
    path: string
    namespace: string
}

export interface CdnResponse {
    name: string
    versions: Array<CdnVersionResponse>
}

export type UpdateStatus =
    | 'upToDate'
    | 'mismatch'
    | 'remoteAhead'
    | 'localAhead'

export interface PackageVersionInfo {
    version: string
    fingerprint: string
}

export interface CheckUpdateResponse {
    status: UpdateStatus
    packageName: string
    localVersionInfo: PackageVersionInfo
    remoteVersionInfo: PackageVersionInfo
}

export interface CheckUpdatesResponse {
    updates: CheckUpdateResponse[]
}

export interface DownloadPackageBody {
    packageName: string
    version: string
}

export interface DownloadPackagesBody {
    packages: DownloadPackageBody[]
}
