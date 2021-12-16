
import { requestToJson$ } from "./utils"


export class ProjectsRouter {

    private static urlBase = '/admin/projects'
    static headers = {}

    static getProjectStatus$(projectId: string) {

        let url = `${ProjectsRouter.urlBase}/${projectId}`
        let request = new Request(url)
        return requestToJson$(request)
    }

    static getFlowStatus$(projectId: string, flowId: string) {

        let url = `${ProjectsRouter.urlBase}/${projectId}/flows/${flowId}`
        let request = new Request(url)
        return requestToJson$(request)
    }

    static getStepStatus$(projectId: string, flowId: string, stepId: string) {

        let url = `${ProjectsRouter.urlBase}/${projectId}/flows/${flowId}/steps/${stepId}`
        let request = new Request(url)
        return requestToJson$(request)
    }

    static runStep$(projectId: string, flowId: string, stepId: string) {

        let url = `${ProjectsRouter.urlBase}/${projectId}/flows/${flowId}/steps/${stepId}/run`
        let request = new Request(url, { method: 'POST' })
        return requestToJson$(request)
    }

    static getArtifacts(projectId: string, flowId: string) {
        let url = `${ProjectsRouter.urlBase}/${projectId}/flows/${flowId}/artifacts`
        let request = new Request(url)
        return requestToJson$(request)
    }
}
