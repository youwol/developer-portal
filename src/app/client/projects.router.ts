
import { requestToJson$ } from "./utils"


export class ProjectsRouter {

    private static urlBase = '/admin/projects'
    static headers = {}

    static getStepStatus$(projectId: string, stepId: string) {

        let url = `${ProjectsRouter.urlBase}/${projectId}/steps/${stepId}`
        let request = new Request(url)
        return requestToJson$(request)
    }

    static runStep$(projectId: string, stepId: string) {

        let url = `${ProjectsRouter.urlBase}/${projectId}/steps/${stepId}/run`
        let request = new Request(url, { method: 'POST' })
        return requestToJson$(request)
    }


}
