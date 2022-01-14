import { requestToJson$ } from './utils'

export class ProjectsRouter {
    private static urlBase = '/admin/projects'
    static headers = {}

    static getProjectStatus$(projectId: string) {
        const url = `${ProjectsRouter.urlBase}/${projectId}`
        const request = new Request(url)
        return requestToJson$(request)
    }

    static getFlowStatus$(projectId: string, flowId: string) {
        const url = `${ProjectsRouter.urlBase}/${projectId}/flows/${flowId}`
        const request = new Request(url)
        return requestToJson$(request)
    }

    static getStepStatus$(projectId: string, flowId: string, stepId: string) {
        const url = `${ProjectsRouter.urlBase}/${projectId}/flows/${flowId}/steps/${stepId}`
        const request = new Request(url)
        return requestToJson$(request)
    }

    static runStep$(projectId: string, flowId: string, stepId: string) {
        const url = `${ProjectsRouter.urlBase}/${projectId}/flows/${flowId}/steps/${stepId}/run`
        const request = new Request(url, { method: 'POST' })
        return requestToJson$(request)
    }

    static getArtifacts(projectId: string, flowId: string) {
        const url = `${ProjectsRouter.urlBase}/${projectId}/flows/${flowId}/artifacts`
        const request = new Request(url)
        return requestToJson$(request)
    }
}
