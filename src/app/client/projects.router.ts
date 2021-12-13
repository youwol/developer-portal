
import { requestToJson$ } from "./utils"


export class ProjectsRouter {

    private static urlBase = '/admin/projects'
    static headers = {}

    static stepStatus$(projectId: string, stepId: string) {

        let url = `${ProjectsRouter.urlBase}/${projectId}/steps/${stepId}`
        let request = new Request(url)
        return requestToJson$(request)
    }

}
