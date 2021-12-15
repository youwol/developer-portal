
type Label = 'Label.DONE' | 'Label.INFO' | 'Label.STARTED' | 'Label.BASH' | 'Label.LOG_ABORT' | 'EnvironmentStatusResponse'
    | 'PipelineStepStatusResponse'

export interface ContextMessage {

    contextId: string
    level: string
    text: string
    labels: Label[]
    parentContextId: string | undefined
    data: unknown
    attributes: { [key: string]: any }
}

export interface UserInfo {
    email: string
    name: string
    memberOf: Array<string>
}

export interface FormalParameter {
    name: string
    description: string
    value: any
    meta: any
}

export interface ConfigurationParameters {
    parameters: { [key: string]: FormalParameter }
}

export interface RemoteGateway {
    name: string
    host: string
}

export interface UserConfiguration {

    general: {
        resources: { [key: string]: string },
        remoteGateways: Array<RemoteGateway>
    }
}

export interface RemoteGatewayInfo {
    name: string
    host: string
    connected: boolean | undefined
}


export interface ArtifactResponse {

    id: string
    path: string
    openingUrl?: string
}

export interface PipelineStep {

    id: string
    artifacts: ArtifactResponse[]
}

export type Status = "OK" | "KO" | "Outdated" | "none"


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
    artifactFolder: string,
    artifacts: ArtifactResponse[]
    manifest: ManifestResponse
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
        userConfig: UserConfiguration,
        projects: Project[],
        pathsBook: {
            config: string
        }
    },
    remoteGatewayInfo: RemoteGatewayInfo
    remotesInfo: Array<RemoteGatewayInfo>
}


export function instanceOfEnvironment(object: any): object is Environment {

    return object.configurationPath && object.userInfo && object.users &&
        object.configuration && object.remoteGatewayInfo && object.remotesInfo

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
