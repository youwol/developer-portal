import { attr$, children$, VirtualDOM } from '@youwol/flux-view'
import { PyYouwol as pyYw } from '@youwol/http-clients'
import { BehaviorSubject, combineLatest } from 'rxjs'
import { map } from 'rxjs/operators'
import {
    commonClassesLeftSideNav,
    leftNavSectionAttr$,
    leftTabWidth,
    Section,
    SectionHeader,
    LeftNavTab
} from '../common'
import { ProjectsState } from './projects.state'
import { DashboardView } from './dashboard'

/**
 * @category View
 */
export class ProjectsTab extends LeftNavTab<ProjectsState, ProjectsTabView> {
    constructor(params: { projectsState: ProjectsState }) {
        super({
            topic: 'Projects',
            title: 'Projects',
            icon: 'fas fa-file-code',
            defaultViewId: 'dashboard',
            defaultView: () =>
                new DashboardView({
                    projectsState: params.projectsState,
                }),
            state: params.projectsState,
            content: () => {
                return new ProjectsTabView({
                    projectsState: params.projectsState,
                })
            },
        })
    }
}

/**
 * @category View
 */
export class ProjectsTabView implements VirtualDOM {
    /**
     * @group State
     */
    public readonly projectsState: ProjectsState

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = commonClassesLeftSideNav

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        width: leftTabWidth,
    }

    /**
     * @group Immutable DOM Constants
     */
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

/**
 * @category View
 */
export class SectionDashboard extends Section {
    /**
     * @group State
     */
    public readonly projectsState: ProjectsState

    /**
     * @group Immutable DOM Constants
     */
    public readonly onclick = () => {
        this.projectsState.selectDashboard()
    }
    constructor(params: { projectsState: ProjectsState }) {
        super({
            header: new SectionHeader({
                class: leftNavSectionAttr$({
                    selectedScreen$:
                        params.projectsState.appState.selectedScreen$,
                    targetTopic: 'Projects',
                    targetViewId: 'dashboard',
                }),
                title: 'Dashboard',
                icon: 'fa-th-large fv-pointer',
            }),
        })
        Object.assign(this, params)
    }
}

/**
 * @category View
 */
export class ProjectItemView {

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'fv-pointer'
    /**
     * @group State
     */
    public readonly projectsState: ProjectsState

    /**
     * @group Immutable Constants
     */
    public readonly project: pyYw.Project

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]
    constructor(params: {
        projectsState: ProjectsState
        project: pyYw.Project
    }) {
        Object.assign(this, params)
        this.children = [
            {
                class: leftNavSectionAttr$({
                    selectedScreen$:
                        params.projectsState.appState.selectedScreen$,
                    targetTopic: 'Projects',
                    targetViewId: this.project.id,
                }),
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
                    this.projectsState.selectProject(this.project.id)
                },
            },
        ]
    }
}

/**
 * @category View
 */
export class SectionProjectsOpened extends Section {

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'my-2 d-flex flex-column'

    /**
     * @group Immutable DOM Constants
     */
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

/**
 * @category View
 */
export class ListProjectsView implements VirtualDOM {

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'pl-4 flex-grow-1 overflow-auto'

    /**
     * @group Observables
     */
    public readonly search$ = new BehaviorSubject('')

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    /**
     * @group States
     */
    public readonly projectsState: ProjectsState

    constructor(params: { projectsState: ProjectsState }) {
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
        Object.assign(this, params)
        const searchTerm = (term: string, project: pyYw.Project) => {
            return (
                project.name.includes(term) ||
                project.version.includes(term) ||
                project.pipeline.tags.reduce(
                    (acc, tag) => acc || tag.includes(term),
                    false,
                )
            )
        }
        this.children = [
            searchView,
            {
                children: children$(
                    combineLatest([
                        this.projectsState.projects$,
                        this.search$,
                    ]).pipe(
                        map(([projects, search]) => {
                            return projects.filter((p) => searchTerm(search, p))
                        }),
                    ),
                    (projects: pyYw.Project[]) => {
                        return projects.map((project) => ({
                            class: 'fv-pointer fv-hover-bg-background-alt rounded px-1 d-flex align-items-center',
                            children: [
                                {
                                    innerText: project.name,
                                },
                                {
                                    class: project.version.includes('-wip')
                                        ? 'fas fa-dot-circle fv-text-focus ml-2'
                                        : '',
                                },
                            ],
                            onclick: () => {
                                this.projectsState.openProject(project)
                            },
                        }))
                    },
                ),
            },
        ]
    }
}

/**
 * @category View
 */
export class SectionAllProjects extends Section {

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        minHeight: '0px',
    }

    /**
     * @group Immutable DOM Constants
     */
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
            content: new ListProjectsView({ projectsState }),
        })
    }
}
