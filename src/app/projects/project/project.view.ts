import { child$, VirtualDOM } from '@youwol/flux-view'
import { filter, mergeMap } from 'rxjs/operators'
import { PyYouwol as pyYw, raiseHTTPErrors } from '@youwol/http-clients'
import { ArtifactsView } from './artifacts.view'
import { DagFlowView } from './dag-flow.view'
import { LastRunStepView, popupModal, StepModal } from './step.view'
import { FlowId, ProjectsState } from '../projects.state'
import { DockableTabs } from '@youwol/fv-tabs'
import { BehaviorSubject, Observable } from 'rxjs'
import { LogsTab } from '../../common'
import { Modal } from '@youwol/fv-group'

/**
 * @category View
 */
export class ProjectView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'd-flex flex-column w-100 h-100'

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        position: 'relative',
    }

    /**
     * @group Immutable Constants
     */
    public readonly id: string

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    /**
     * @group States
     */
    public readonly projectsState: ProjectsState

    /**
     * @group Immutable Constants
     */
    public readonly project: pyYw.Project

    constructor(params: {
        projectsState: ProjectsState
        project: pyYw.Project
    }) {
        Object.assign(this, params)
        this.id = this.project.id
        const events = this.projectsState.projectEvents[this.project.id]

        const bottomNavState = new DockableTabs.State({
            disposition: 'bottom',
            persistTabsView: true,
            viewState$: new BehaviorSubject<DockableTabs.DisplayMode>(
                'collapsed',
            ),
            tabs$: new BehaviorSubject([
                new LogsTab({
                    message$:
                        this.projectsState.projectEvents[this.project.id]
                            .messages$,
                }),
            ]),
            selected$: new BehaviorSubject<string>('logs'),
        })
        const bottomNav = new DockableTabs.View({
            state: bottomNavState,
            styleOptions: { initialPanelSize: '500px' },
        })

        this.children = [
            {
                class: 'w-100 h-100 py-2 overflow-auto',
                style: { minHeight: '0px' },
                children: [
                    new ProjectHeaderView(params),
                    child$(events.selectedStep$, ({ flowId, step }) => {
                        return {
                            class: 'd-flex flex-grow-1 w-100',
                            children: [
                                child$(
                                    this.projectsState.projectEvents[
                                        this.project.id
                                    ].selectedStep$,
                                    (selection) => {
                                        return selection.step == undefined
                                            ? new FlowSummaryView(params)
                                            : new LastRunStepView({
                                                  projectsState:
                                                      this.projectsState,
                                                  project: this.project,
                                                  flowId,
                                                  step,
                                              })
                                    },
                                ),
                            ],
                        }
                    }),
                ],
            },
            bottomNav,
        ]
        events.configureStep$
            .pipe(filter(({ step }) => step != undefined))
            .subscribe(({ flowId, step }) => {
                popupModal(
                    (modalState: Modal.State) =>
                        new StepModal({
                            modalState,
                            projectsState: this.projectsState,
                            project: this.project,
                            flowId,
                            step,
                        }),
                )
            })
    }
}

/**
 * @category View
 */
export class FlowsSelectorView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'd-flex mx-2'

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
    public readonly children: VirtualDOM[]

    /**
     * @group Observables
     */
    public readonly selectedFlow$: Observable<FlowId>

    constructor(params: {
        projectsState: ProjectsState
        project: pyYw.Project
    }) {
        Object.assign(this, params)
        this.selectedFlow$ =
            this.projectsState.projectEvents[this.project.id].selectedFlow$

        this.children = this.project.pipeline.flows.map((flow) => {
            return this.labelView(flow.name)
        })
    }

    labelView(targetFlowId: string): VirtualDOM {
        return child$(this.selectedFlow$, (selectedFlowId) => {
            const defaultClasses = 'p-2 border rounded fv-pointer'
            return {
                class:
                    selectedFlowId == targetFlowId
                        ? `${defaultClasses} fv-bg-secondary fv-hover-xx-lighter`
                        : `${defaultClasses} fv-hover-bg-background-alt`,
                innerText: targetFlowId,
                onclick: () => {
                    this.projectsState.selectFlow(this.project.id, targetFlowId)
                },
            }
        })
    }
}

/**
 * @category View
 */
export class ProjectHeaderView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 d-flex flex-column'

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
    public readonly children: VirtualDOM[]
    constructor(params: {
        projectsState: ProjectsState
        project: pyYw.Project
    }) {
        Object.assign(this, params)
        this.children = [
            {
                class: 'd-flex justify-content-around align-items-center p-1 mx-auto border-bottom',
                style: { width: 'fit-content' },
                children: [
                    {
                        tag: 'div',
                        style: {
                            fontSize: '25px',
                        },
                        class: 'text-center',
                        innerText: `${this.project.name}#${this.project.version}`,
                    },
                    new FlowsSelectorView(params),
                ],
            },
            child$(
                this.projectsState.projectEvents[this.project.id].selectedFlow$,
                (flowId) =>
                    new DagFlowView({
                        projectsState: this.projectsState,
                        project: this.project,
                        flowId: flowId,
                    }),
            ),
        ]
    }
}

/**
 * @category View
 */
export class FlowSummaryView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-50 h-50'

    /**
     * @group States
     */
    public readonly projectsState: ProjectsState

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    /**
     * @group Immutable Constants
     */
    public readonly project: pyYw.Project

    constructor(params: {
        projectsState: ProjectsState
        project: pyYw.Project
    }) {
        Object.assign(this, params)
        const selectedStep$ =
            this.projectsState.projectEvents[this.project.id].selectedStep$

        this.children = [
            {
                tag: 'h3',
                class: 'text-center',
                innerText: 'Flow summary',
            },
            child$(
                selectedStep$.pipe(
                    mergeMap(({ flowId }) => {
                        return this.projectsState.projectsClient.getArtifacts$({
                            projectId: this.project.id,
                            flowId,
                        })
                    }),
                    raiseHTTPErrors(),
                ),
                ({ artifacts }) => {
                    return new ArtifactsView(artifacts)
                },
            ),
        ]
    }
}
