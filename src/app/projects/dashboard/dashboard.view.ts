import { VirtualDOM } from '@youwol/flux-view'
import * as pyYw from '@youwol/local-youwol-client'
import { ProjectsState } from '../projects.state'
import { DashboardTemplateView } from '../../common'

/**
 * @category View
 */
export class DashboardView extends DashboardTemplateView<
    pyYw.Routers.Projects.Project,
    ProjectsState
> {
    constructor(params: { projectsState: ProjectsState }) {
        super({
            state: params.projectsState,
            dataSource$: params.projectsState.projects$,
            cardView: (data) => {
                return new ProjectSnippetView({
                    projectsState: params.projectsState,
                    project: data,
                })
            },
        })
        params.projectsState.projectsClient.status$().subscribe()
    }
}

/**
 * @category View
 */
export class ProjectSnippetView {
    /**
     * @category Immutable DOM Constants
     */
    public readonly style = {
        height: 'fit-content',
    }
    /**
     * @category Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]
    /**
     * @category States
     */
    public readonly projectsState: ProjectsState

    /**
     * @category Immutable Constants
     */
    public readonly project: pyYw.Routers.Projects.Project

    /**
     * @category Immutable DOM Constants
     */
    public readonly onclick: (ev: MouseEvent) => void

    constructor(params: {
        projectsState: ProjectsState
        project: pyYw.Routers.Projects.Project
    }) {
        Object.assign(this, params)

        this.children = [
            {
                tag: 'h4',
                innerText: this.project.name,
            },
            {
                tag: 'h5',
                innerText: this.project.version,
            },
            {
                tag: 'h5',
                innerText: this.project.pipeline.target.family,
            },
            {
                class: 'w-100 d-flex align-items-center',
                children: this.project.pipeline.tags.map((t) => ({
                    class: 'px-2',
                    innerText: t,
                })),
            },
        ]
        this.onclick = () => {
            this.projectsState.openProject(this.project)
        }
    }
}
