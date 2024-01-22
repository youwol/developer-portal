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
import { popupModal } from './project'
import { Modal } from '@youwol/rx-group-views'

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
            new SectionUnloadedProjects({ projectsState: this.projectsState }),
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
export class ListUnloadedProjectsView implements VirtualDOM<'div'> {
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
            failure: pyYw.Routers.Projects.Failure,
        ) => {
            return (
                failure.failure.includes(term) ||
                failure.path.includes(term) ||
                failure.message.includes(term)
            )
        }
        this.children = [
            searchView,
            {
                tag: 'div',
                class: {
                    source$: params.projectsState.dropdownHandler$,
                    vdomMap: (isShow) => (isShow ? '' : 'd-none'),
                },
                children: {
                    policy: 'replace',
                    source$: combineLatest([
                        this.projectsState.projectsFailures$,
                        this.search$,
                    ]).pipe(
                        map(([failures, search]) => {
                            return failures.filter((p) => searchTerm(search, p))
                        }),
                    ),
                    vdomMap: (failures: pyYw.Routers.Projects.Failure[]) => {
                        return failures.map(
                            (failure: pyYw.Routers.Projects.Failure) => {
                                return {
                                    tag: 'div',
                                    class: 'fv-pointer fv-hover-bg-background-alt rounded px-1 d-flex align-items-center',
                                    children: [
                                        {
                                            tag: 'div',
                                            innerText: failure.path
                                                .split('/')
                                                .pop(),
                                        },
                                        {
                                            tag: 'div',
                                            class: 'fas fa-exclamation-circle fv-text-error ml-2',
                                        },
                                    ],
                                    onclick: () => {
                                        popupModal(
                                            (modalState: Modal.State) =>
                                                new FailureProjectView({
                                                    modalState,
                                                    failure,
                                                }),
                                        )
                                    },
                                }
                            },
                        )
                    },
                },
            },
        ]
    }
}

export class FailureProjectView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class =
        'd-flex flex-column p-4 fv-bg-background-alt border-rounded '
    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        position: 'relative' as const,
        width: '75vh',
        maxHeight: '75vh',
        overflowWrap: 'anywhere' as const,
    }
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    /**
     *
     * @group States
     */
    public readonly modalState: Modal.State

    constructor(params: {
        modalState: Modal.State
        failure: pyYw.Routers.Projects.Failure
    }) {
        Object.assign(this, params)
        this.children = [
            {
                tag: 'div',
                class: 'pt-2 px-2 text-start  fv-text-primary',
                innerText: `Path: `,
            },
            {
                tag: 'div',
                class: 'px-2 text-start  fv-text-focus',
                innerText: ` ${params.failure.path}`,
            },
            {
                tag: 'div',
                class: ' pt-2 px-2 text-start  fv-text-primary',
                innerText: `Exception type: `,
            },
            {
                tag: 'div',
                class: 'px-2 text-start  fv-text-focus',
                innerText: ` ${params.failure['exceptionType']}`,
            },
            {
                tag: 'div',
                class: 'pt-2 px-2 text-start  fv-text-primary',
                innerText: `Message:`,
            },
            {
                tag: 'div',
                class: 'px-2 text-start  fv-text-focus',
                innerText: ` ${params.failure['message']}`,
            },
            {
                tag: 'div',
                class: 'pt-2 px-2 text-start overflow-auto fv-bg-background fv-text-error ',
                style: {
                    whiteSpace: 'pre-wrap',
                },
                innerText: ` ${params.failure['traceback']} `,
            },
            {
                tag: 'div',
                class: 'fas fa-times  fv-pointer  fv-text-focus',
                style: {
                    position: 'absolute',
                    content: '',
                    top: '10px',
                    right: '10px',
                },
                onclick: () => {
                    this.modalState.ok$.next(undefined)
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
    public readonly class = 'vh-100 my-2 flex-grow-1 d-flex flex-column'

    constructor({ projectsState }: { projectsState: ProjectsState }) {
        super({
            header: new SectionHeader({
                title: {
                    source$: combineLatest([
                        projectsState.projects$,
                        projectsState.projectsFailures$,
                    ]),
                    vdomMap: ([projects, failures]) =>
                        `All projects (${projects.length} / ${
                            projects.length + failures.length
                        })`,
                },
                icon: 'fas fa-list-alt',
            }),
            content: new ListProjectsView({ projectsState }),
        })
    }
}

/**
 * @category View
 */
export class SectionUnloadedProjects extends Section {
    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        minHeight: '0px',
    }

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'vh-100 my-2 flex-grow-1 d-flex flex-column'

    constructor({ projectsState }: { projectsState: ProjectsState }) {
        const dropdownHandler$ = new BehaviorSubject<boolean>(false)
        const expanderView = [
            {
                tag: 'i',
                class: {
                    source$: dropdownHandler$,
                    vdomMap: (isArrowUp) => (isArrowUp ? 'down' : 'up'),
                    wrapper: (d) => `fas fa-chevron-${d} mx-3`,
                },
            } as VirtualDOM<'i'>,
        ]
        super({
            header: new SectionHeader({
                title: {
                    source$: projectsState.projectsFailures$,
                    vdomMap: (failures: pyYw.Routers.Projects.Failure[]) =>
                        `Projects fails (${failures.length})`,
                },
                icon: 'fas fa-exclamation-triangle',
                withChildren: expanderView,
            }),
            content: new ListUnloadedProjectsView({ projectsState }),
        })
    }
}
