import { children$, VirtualDOM } from "@youwol/flux-view"
import { map } from "rxjs/operators"
import { AppState } from "src/app/app-state"
import { Environment, Project } from "../../client/models"
import { ProjectSnippetView } from "./project-snippet.view"


export class DashboardView {

    public readonly class = "w-100 h-100"

    public readonly children: VirtualDOM[]

    public readonly state: AppState

    constructor(params: { state: AppState }) {

        Object.assign(this, params)

        this.children = [
            new ProjectsView(params)
        ]
    }
}

export class ProjectsView {


    public readonly class = "w-100 h-100 d-flex flex-wrap p-2 "

    public readonly children: any

    public readonly state: AppState

    constructor(params: { state: AppState }) {

        Object.assign(this, params)

        this.children = children$(
            this.state.environment$.pipe(
                map((env: Environment) => env.configuration.projects)
            ),
            (projects: Project[]) => {
                return projects.map((project) => new ProjectSnippetView({ state: this.state, project }))
            }

        )
    }
}

