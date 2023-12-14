import { AnyVirtualDOM, ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import * as pyYw from '@youwol/local-youwol-client'
import { BehaviorSubject, combineLatest } from 'rxjs'
import { map } from 'rxjs/operators'
import {
    commonClassesLeftSideNav,
    leftNavSectionAttr$,
    leftTabWidth,
    Section,
    SectionHeader,
    LeftNavTab,
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
export class ProjectsTabView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

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
    public readonly children: ChildrenLike

    constructor(params: { projectsState: ProjectsState }) {
        Object.assign(this, params)
        this.children = [
            new SectionDashboard({ projectsState: this.projectsState }),
            new SectionNewProject({ projectsState: this.projectsState }),
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
                icon: 'fas fa-th-large fv-pointer',
            }),
        })
        Object.assign(this, params)
    }
}

/**
 * @category View
 */
export class SectionNewProject extends Section {
    constructor({ projectsState }: { projectsState: ProjectsState }) {
        super({
            header: new SectionHeader({
                class: leftNavSectionAttr$({
                    selectedScreen$: projectsState.appState.selectedScreen$,
                    targetTopic: 'Projects',
                    targetViewId: 'new',
                }),
                title: 'New project',
                icon: 'fas fa-plus-square fv-pointer',
            }),
            content: {
                tag: 'div',
                class: 'pl-4 flex-grow-1 overflow-auto',
                children: {
                    policy: 'replace',
                    source$: projectsState.appState.environment$,
                    vdomMap: (
                        environment: pyYw.Routers.Environment.EnvironmentStatusResponse,
                    ) => {
                        return environment.configuration.projects.templates.map(
                            (projectTemplate) =>
                                new ProjectTemplateItemView({
                                    projectTemplate,
                                    projectsState,
                                }),
                        )
                    },
                },
            },
        })
    }
}

/**
 * @category View
 */
export class ProjectItemView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

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
    public readonly project: pyYw.Routers.Projects.Project

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(params: {
        projectsState: ProjectsState
        project: pyYw.Routers.Projects.Project
    }) {
        Object.assign(this, params)
        this.children = [
            {
                tag: 'div',
                class: leftNavSectionAttr$({
                    selectedScreen$:
                        params.projectsState.appState.selectedScreen$,
                    targetTopic: 'Projects',
                    targetViewId: this.project.id,
                }),
                children: [
                    {
                        tag: 'div',
                        innerText: `${this.project.name}`,
                    },
                    {
                        tag: 'div',
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
export class ProjectTemplateItemView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

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
    public readonly projectTemplate: pyYw.Routers.Environment.ProjectTemplate

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(params: {
        projectsState: ProjectsState
        projectTemplate: pyYw.Routers.Environment.ProjectTemplate
    }) {
        Object.assign(this, params)

        this.children = [
            {
                tag: 'div',
                class: leftNavSectionAttr$({
                    selectedScreen$:
                        params.projectsState.appState.selectedScreen$,
                    targetTopic: 'Projects',
                    targetViewId: this.projectTemplate.type,
                }),
                children: [
                    {
                        tag: 'div',
                        class: 'd-flex align-items-center p-1',
                        children: [
                            this.projectTemplate.icon as AnyVirtualDOM,
                            { tag: 'div', class: 'px-2' },
                            {
                                tag: 'div',
                                innerText: this.projectTemplate.type,
                            },
                        ],
                    },
                ],
                onclick: () => {
                    this.projectsState.newProjectFromTemplate(
                        this.projectTemplate,
                    )
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
                title: {
                    source$: projectsState.openProjects$,
                    vdomMap: (projects: pyYw.Routers.Projects.Project[]) =>
                        `Opened projects (${projects.length})`,
                },
                icon: 'fas fa-folder-open',
            }),
            content: {
                tag: 'div',
                class: 'pl-4 flex-grow-1 overflow-auto',
                children: {
                    policy: 'replace',
                    source$: projectsState.openProjects$,
                    vdomMap: (projects: pyYw.Routers.Projects.Project[]) => {
                        return projects.map(
                            (project) =>
                                new ProjectItemView({ project, projectsState }),
                        )
                    },
                },
            },
        })
    }
}

/**
 * @category View
 */
export class ListProjectsView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

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
    public readonly children: ChildrenLike

    /**
     * @group States
     */
    public readonly projectsState: ProjectsState

    constructor(params: { projectsState: ProjectsState }) {
        const searchView: VirtualDOM<'div'> = {
            tag: 'div',
            class: 'd-flex align-items-center  my-2 w-100 px-2',
            children: [
                {
                    tag: 'div',
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
                    oninput: (ev) => this.search$.next(ev.target['value']),
                },
            ],
        }
        Object.assign(this, params)
        const searchTerm = (
            term: string,
            project: pyYw.Routers.Projects.Project,
        ) => {
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
                tag: 'div',
                children: {
                    policy: 'replace',
                    source$: combineLatest([
                        this.projectsState.projects$,
                        this.search$,
                    ]).pipe(
                        map(([projects, search]) => {
                            return projects.filter((p) => searchTerm(search, p))
                        }),
                    ),
                    vdomMap: (projects: pyYw.Routers.Projects.Project[]) => {
                        return projects.map((project) => ({
                            tag: 'div',
                            class: 'fv-pointer fv-hover-bg-background-alt rounded px-1 d-flex align-items-center',
                            children: [
                                {
                                    tag: 'div',
                                    innerText: project.name,
                                },
                                {
                                    tag: 'div',
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
                },
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
                title: {
                    source$: projectsState.projects$,
                    vdomMap: (projects: pyYw.Routers.Projects.Project[]) =>
                        `All projects (${projects.length})`,
                },
                icon: 'fas fa-list-alt',
            }),
            content: new ListProjectsView({ projectsState }),
        })
    }
}
