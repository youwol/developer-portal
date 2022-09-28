import { child$, HTMLElement$, render, VirtualDOM } from '@youwol/flux-view'
import * as fluxView from '@youwol/flux-view'
import * as rxjs from 'rxjs'
import * as cdnClient from '@youwol/cdn-client'
import { PyYouwol as pyYw, raiseHTTPErrors } from '@youwol/http-clients'
import { ArtifactsView } from './artifacts.view'
import { ManifestView } from './manifest.view'
import { RunOutputsView } from './run-outputs.view'
import { ProjectsState } from '../projects.state'
import { Modal } from '@youwol/fv-group'
import { merge } from 'rxjs'
import { take } from 'rxjs/operators'

/**
 * @category View
 */
export class StepModal implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 h-100 d-flex flex-column px-4'

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

    /**
     * @group Immutable Constants
     */
    public readonly flowId: string

    /**
     * @group Immutable Constants
     */
    public readonly step: pyYw.PipelineStep

    /**
     *
     * @group States
     */
    public readonly modalState: Modal.State

    constructor(params: {
        modalState: Modal.State
        projectsState: ProjectsState
        project: pyYw.Project
        step: pyYw.PipelineStep
        flowId: string
    }) {
        Object.assign(this, params)
        const projectsRouter = new pyYw.PyYouwolClient().admin.projects

        this.children = [
            child$(
                new pyYw.PyYouwolClient().admin.projects
                    .getStepView$({
                        projectId: this.project.id,
                        stepId: this.step.id,
                        flowId: this.flowId,
                    })
                    .pipe(raiseHTTPErrors()),
                (js) => {
                    return new Function(js)()({
                        modalState: this.modalState,
                        project: this.project,
                        flowId: this.flowId,
                        stepId: this.step.id,
                        projectsRouter,
                        fluxView,
                        rxjs,
                        cdnClient,
                    })
                },
            ),
        ]
    }
}

export function popupModal(
    contentView: (modalState) => VirtualDOM,
    sideEffect = (_htmlElement: HTMLDivElement, _state: Modal.State) => {
        /* noop*/
    },
) {
    const modalState = new Modal.State()

    const view = new Modal.View({
        state: modalState,
        contentView,
        connectedCallback: (elem: HTMLDivElement & HTMLElement$) => {
            sideEffect(elem, modalState)
            elem.children[0].classList.add('fv-text-primary')
            // https://stackoverflow.com/questions/63719149/merge-deprecation-warning-confusion
            merge(...[modalState.cancel$, modalState.ok$])
                .pipe(take(1))
                .subscribe(() => {
                    modalDiv.remove()
                })
        },
    })
    const modalDiv = render(view)
    document.querySelector('body').appendChild(modalDiv)
}

/**
 * @category View
 */
export class LastRunStepView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 h-50 d-flex flex-column px-4'

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

    /**
     * @group Immutable Constants
     */
    public readonly flowId: string

    /**
     * @group Immutable Constants
     */
    public readonly step: pyYw.PipelineStep

    /**
     * @group Immutable DOM Constants
     */
    connectedCallback: (elem: HTMLElement$ & HTMLDivElement) => void

    constructor(params: {
        projectsState: ProjectsState
        project: pyYw.Project
        step: pyYw.PipelineStep
        flowId: string
    }) {
        Object.assign(this, params)

        const stepStream$ = this.projectsState.projectEvents[
            this.project.id
        ].getStep$(this.flowId, this.step.id)

        this.children = [
            child$(
                stepStream$.status$,
                (data: pyYw.PipelineStepStatusResponse) => {
                    return {
                        class: 'flex-grow-1 d-flex w-100',
                        children: [
                            {
                                class: ' d-flex flex-column w-50',
                                children: [
                                    new RunOutputsView(stepStream$.log$),
                                    data.manifest
                                        ? new ManifestView(data.manifest)
                                        : undefined,
                                ],
                            },
                            {
                                class: 'w-50',
                                children: [
                                    data.artifacts && data.artifacts.length > 0
                                        ? new ArtifactsView(data.artifacts)
                                        : undefined,
                                ],
                            },
                        ],
                    }
                },
            ),
        ]
    }
}
