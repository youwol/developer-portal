import { children$, Stream$, VirtualDOM } from '@youwol/flux-view'
import { PyYouwol as pyYw } from '@youwol/http-clients'
import { ProjectSnippetView } from './project-snippet.view'
import { ProjectsState } from '../projects.state'

export class DashboardView {
    public readonly id: string = 'dashboard'
    public readonly class = 'w-100 h-100'

    public readonly style = {
        maxHeight: '100%',
        height: 'fit-content',
    }

    public readonly children: VirtualDOM[]

    constructor(params: { projectsState: ProjectsState }) {
        Object.assign(this, params)

        this.children = [new ProjectsView(params)]
    }
}

export function projectLoadingIsSuccess(result: any): result is pyYw.Project {
    return result['failure'] === undefined
}

export class ProjectsView {
    public readonly class =
        'w-100 h-100 d-flex flex-wrap p-2 overflow-auto justify-content-around '

    public readonly children: Stream$<pyYw.Project[], ProjectSnippetView[]>

    public readonly projectsState: ProjectsState

    constructor(params: { projectsState: ProjectsState }) {
        Object.assign(this, params)

        this.children = children$(
            this.projectsState.projects$,
            (projects: pyYw.Project[]) => {
                return projects.map(
                    (project) =>
                        new ProjectSnippetView({
                            projectsState: this.projectsState,
                            project,
                        }),
                )
            },
        )
    }
}
