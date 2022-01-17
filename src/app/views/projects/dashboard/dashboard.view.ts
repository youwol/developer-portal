import { children$, VirtualDOM } from '@youwol/flux-view'
import { map, tap } from 'rxjs/operators'
import { AppState } from '../../../app-state'
import { Project, projectLoadingIsSuccess } from '../../../client/models'
import { ProjectSnippetView } from './project-snippet.view'

export class DashboardView {
    public readonly class = 'w-100'

    public readonly style = {
        maxHeight: '100%',
        height: 'fit-content',
    }

    public readonly children: VirtualDOM[]

    public readonly state: AppState

    constructor(params: { state: AppState }) {
        Object.assign(this, params)

        this.children = [new ProjectsView(params)]
    }
}

export class ProjectsView {
    public readonly class = 'w-100 h-100 d-flex flex-wrap p-2 '

    public readonly children: any

    public readonly state: AppState

    constructor(params: { state: AppState }) {
        Object.assign(this, params)

        this.children = children$(
            this.state.projectsLoading$.pipe(
                tap((r) => console.warn(r)),
                map((results) =>
                    results.filter((result) => projectLoadingIsSuccess(result)),
                ),
            ),
            (projects: Project[]) => {
                return projects.map(
                    (project) =>
                        new ProjectSnippetView({ state: this.state, project }),
                )
            },
        )
    }
}
