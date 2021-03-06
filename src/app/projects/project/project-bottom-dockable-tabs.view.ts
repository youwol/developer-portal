import { DockableTabs } from '@youwol/fv-tabs'
import { ProjectsState } from '../projects.state'
import { VirtualDOM } from '@youwol/flux-view'
import { TerminalView } from '../../common/terminal/terminal.view'
import { PyYouwol as pyYw } from '@youwol/http-clients'

export class LogsTab extends DockableTabs.Tab {
    constructor(params: {
        projectsState: ProjectsState
        project: pyYw.Project
    }) {
        super({
            id: 'logs',
            title: 'Logs',
            icon: 'fas fa-volume-up',
            content: () => {
                return new LogsTabView({
                    projectsState: params.projectsState,
                    project: params.project,
                })
            },
        })
    }
}

export class LogsTabView implements VirtualDOM {
    public readonly projectsState: ProjectsState
    public readonly project: pyYw.Project
    public readonly class = 'p-2 d-flex flex-column overflow-auto'
    public readonly style = {
        minHeight: '500px',
        maxHeight: '500px',
    }
    public readonly children: VirtualDOM[]

    constructor(params: {
        projectsState: ProjectsState
        project: pyYw.Project
    }) {
        Object.assign(this, params)
        const events =
            this.projectsState.projectEvents[this.project.id].messages$

        this.children = [new TerminalView(events)]
    }
}
