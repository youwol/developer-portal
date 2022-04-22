import { DockableTabs } from '@youwol/fv-tabs'
import { attr$, children$, VirtualDOM } from '@youwol/flux-view'
import { PyYouwol as pyYw } from '@youwol/http-clients'
import { BehaviorSubject, combineLatest } from 'rxjs'
import { map } from 'rxjs/operators'
import { Section, SectionHeader } from '../common/utils-view'
import { ProjectsState } from './projects.state'

export class ProjectsTab extends DockableTabs.Tab {
    constructor(params: { projectsState: ProjectsState }) {
        super({
            id: 'projects',
            title: 'Projects',
            icon: 'fas fa-file-code',
            content: () => {
                return new ProjectsTabView({
                    projectsState: params.projectsState,
                })
            },
        })
    }
}

export class ProjectsTabView implements VirtualDOM {
    public readonly projectsState: ProjectsState
    public readonly class = 'p-2 d-flex flex-column h-100'
    public readonly style = {
        minHeight: '0px',
    }
    public readonly children: VirtualDOM[]

    constructor(params: { projectsState: ProjectsState }) {
        Object.assign(this, params)
        this.children = [
            new SectionDashboard({ projectsState: this.projectsState }),
            new SectionProjectsOpened({ projectsState: this.projectsState }),
            new SectionAllProjects({ projectsState: this.projectsState }),
        ]
    }
}

class SectionDashboard extends Section {
    public readonly projectsState: ProjectsState
    public readonly onclick = () => {
        this.projectsState.appState.selectScreen('dashboard')
    }
    constructor(params: { projectsState: ProjectsState }) {
        super({
            header: new SectionHeader({
                class: attr$(
                    params.projectsState.appState.selectedScreen$,
                    ({ viewId }): string =>
                        viewId == 'dashboard' ? 'fv-text-focus' : '',
                    {
                        wrapper: (d) =>
                            `${d} fv-hover-bg-background-alt d-flex align-items-center px-1 rounded`,
                    },
                ),
                title: 'Dashboard',
                icon: 'fa-th-large fv-pointer',
            }),
        })
        Object.assign(this, params)
    }
}

class ProjectItemView {
    public readonly class = 'fv-pointer'
    public readonly projectsState: ProjectsState
    public readonly project: pyYw.Project
    public readonly children: VirtualDOM[]
    constructor(params: {
        projectsState: ProjectsState
        project: pyYw.Project
    }) {
        Object.assign(this, params)
        this.children = [
            {
                class: attr$(
                    this.projectsState.appState.selectedScreen$,
                    ({ viewId }): string =>
                        viewId == this.project.id ? 'fv-text-focus' : '',
                    {
                        wrapper: (d) =>
                            `${d} fv-hover-bg-background-alt d-flex align-items-center  rounded px-1`,
                    },
                ),
                children: [
                    {
                        innerText: this.project.name,
                    },
                    {
                        class: 'fas fa-times fv-text-error fv-xx-darker fv-hover-xx-lighter pl-2 mx-2',
                        onclick: (ev) => {
                            ev.stopPropagation()
                            this.projectsState.closeProject(this.project.id)
                        },
                    },
                ],
                onclick: () => {
                    this.projectsState.appState.selectScreen(this.project.id)
                },
            },
        ]
    }
}
class SectionProjectsOpened extends Section {
    public readonly class = 'my-2 d-flex flex-column'
    public readonly style = {
        maxHeight: '30%',
    }

    constructor({ projectsState }: { projectsState: ProjectsState }) {
        super({
            header: new SectionHeader({
                title: attr$(
                    projectsState.openProjects$,
                    (projects) => `Opened projects (${projects.length})`,
                ),
                icon: 'fa-folder-open',
            }),
            content: {
                class: 'pl-4 flex-grow-1 overflow-auto',
                children: children$(
                    projectsState.openProjects$,
                    (projects: pyYw.Project[]) => {
                        return projects.map(
                            (project) =>
                                new ProjectItemView({ project, projectsState }),
                        )
                    },
                ),
            },
        })
    }
}

class ContentView implements VirtualDOM {
    public readonly class = 'pl-4 flex-grow-1 overflow-auto'
    public readonly search$ = new BehaviorSubject('')
    public readonly children

    constructor({ projectsState }: { projectsState: ProjectsState }) {
        let searchView = {
            class: 'd-flex align-items-center  my-2 w-100 px-2',
            children: [
                {
                    class: 'fas fa-search mr-1',
                },
                {
                    class: 'flex-grow-1',
                    tag: 'input',
                    type: 'text',
                    style: {
                        fontSize: 'small',
                    },
                    value: this.search$.getValue(),
                    oninput: (ev) => this.search$.next(ev.target.value),
                },
            ],
        }

        this.children = [
            searchView,
            {
                children: children$(
                    combineLatest([projectsState.projects$, this.search$]).pipe(
                        map(([projects, search]) => {
                            return projects.filter((p) =>
                                p.name.includes(search),
                            )
                        }),
                    ),
                    (projects: pyYw.Project[]) => {
                        return projects.map((project) => ({
                            class: 'fv-pointer fv-hover-bg-background-alt rounded px-1',
                            innerHTML: project.name,
                            onclick: () => {
                                projectsState.openProject(project)
                            },
                        }))
                    },
                ),
            },
        ]
    }
}
class SectionAllProjects extends Section {
    public readonly style = {
        minHeight: '0px',
    }
    public readonly class = 'my-2 flex-grow-1 d-flex flex-column'
    constructor({ projectsState }: { projectsState: ProjectsState }) {
        super({
            header: new SectionHeader({
                title: attr$(
                    projectsState.projects$,
                    (projects) => `All projects (${projects.length})`,
                ),
                icon: 'fa-list-alt',
            }),
            content: new ContentView({ projectsState }),
        })
    }
}
