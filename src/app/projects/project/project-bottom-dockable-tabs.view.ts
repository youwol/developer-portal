import { DockableTabs } from '@youwol/fv-tabs'
import { ProjectsState } from '../projects.state'
import { VirtualDOM } from '@youwol/flux-view'
import { TerminalView } from '../../common/terminal/terminal.view'
import { PyYouwol as pyYw } from '@youwol/http-clients'

/**
 * @category View
 */
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

/**
 * @Category View
 */
export class LogsTabView implements VirtualDOM {


    /**
     * @group States
     */
    public readonly projectsState: ProjectsState

    /**
     * @group Immutable Constants
     */
    public readonly project: pyYw.Project

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'p-2 d-flex flex-column overflow-auto'

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        minHeight: '500px',
        maxHeight: '500px',
    }

    /**
     * @group Immutable DOM Constants
     */
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
