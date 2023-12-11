import {
    ChildrenLike,
    render,
    RxHTMLElement,
    VirtualDOM,
} from '@youwol/rx-vdom'
// import * as fluxView from '@youwol/rx-vdom'
// import * as rxjs from 'rxjs'
import * as webpmClient from '@youwol/webpm-client'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import * as pyYw from '@youwol/local-youwol-client'
import { ArtifactsView } from './artifacts.view'
import { ManifestView } from './manifest.view'
import { RunOutputsView } from './run-outputs.view'
import { ProjectsState } from '../projects.state'
import { Modal } from '@youwol/rx-group-views'
import { from, merge, mergeMap } from 'rxjs'
import { take, tap } from 'rxjs/operators'

/**
 * @category View
 */
export class StepModal implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 h-100 d-flex flex-column px-4'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    /**
     * @group States
     */
    public readonly projectsState: ProjectsState

    /**
     * @group Immutable Constants
     */
    public readonly project: pyYw.Routers.Projects.Project

    /**
     * @group Immutable Constants
     */
    public readonly flowId: string

    /**
     * @group Immutable Constants
     */
    public readonly step: pyYw.Routers.Projects.PipelineStep

    /**
     *
     * @group States
     */
    public readonly modalState: Modal.State

    constructor(params: {
        modalState: Modal.State
        projectsState: ProjectsState
        project: pyYw.Routers.Projects.Project
        step: pyYw.Routers.Projects.PipelineStep
        flowId: string
    }) {
        Object.assign(this, params)
        const projectsRouter = new pyYw.PyYouwolClient().admin.projects

        this.children = [
            {
                source$: new pyYw.PyYouwolClient().admin.projects
                    .getStepView$({
                        projectId: this.project.id,
                        stepId: this.step.id,
                        flowId: this.flowId,
                    })
                    .pipe(
                        raiseHTTPErrors(),
                        mergeMap((js) => from([js])),
                        tap((v) => v),
                    ),
                vdomMap: (js: string) => {
                    console.log('js :', typeof js)
                    return new Function(js)()({
                        modalState: this.modalState,
                        project: this.project,
                        flowId: this.flowId,
                        stepId: this.step.id,
                        projectsRouter,
                        webpmClient,
                    })
                },
            },
        ]
    }
}

export function popupModal(
    contentView: (modalState) => VirtualDOM<'div'>,
    sideEffect = (_htmlElement: HTMLDivElement, _state: Modal.State) => {
        /* noop*/
    },
) {
    const modalState = new Modal.State()

    const view = new Modal.View({
        state: modalState,
        contentView,
        connectedCallback: (elem: RxHTMLElement<'div'>) => {
            sideEffect(elem, modalState)
            elem.children[0].classList.add('fv-text-primary')
            merge(modalState.cancel$, modalState.ok$)
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
export class LastRunStepView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 h-50 d-flex flex-column px-4'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    /**
     * @group States
     */
    public readonly projectsState: ProjectsState

    /**
     * @group Immutable Constants
     */
    public readonly project: pyYw.Routers.Projects.Project

    /**
     * @group Immutable Constants
     */
    public readonly flowId: string

    /**
     * @group Immutable Constants
     */
    public readonly step: pyYw.Routers.Projects.PipelineStep

    /**
     * @group Immutable DOM Constants
     */
    connectedCallback: (elem: RxHTMLElement<'div'>) => void

    constructor(params: {
        projectsState: ProjectsState
        project: pyYw.Routers.Projects.Project
        step: pyYw.Routers.Projects.PipelineStep
        flowId: string
    }) {
        Object.assign(this, params)

        const stepStream$ = this.projectsState.projectEvents[
            this.project.id
        ].getStep$(this.flowId, this.step.id)

        this.children = [
            {
                source$: stepStream$.status$,
                vdomMap: (
                    data: pyYw.Routers.Projects.PipelineStepStatusResponse,
                ) => {
                    return {
                        tag: 'div',
                        class: 'flex-grow-1 d-flex w-100',
                        children: [
                            {
                                tag: 'div',
                                class: ' d-flex flex-column w-50 overflow-auto',
                                children: [
                                    new RunOutputsView(stepStream$.log$),
                                    data.manifest
                                        ? new ManifestView(data.manifest)
                                        : undefined,
                                ],
                            },
                            {
                                tag: 'div',
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
            },
            // child$(
            //     stepStream$.status$,
            //     (data: pyYw.Routers.Projects.PipelineStepStatusResponse) => {
            //         return {
            //             tag:'div',
            //             class: 'flex-grow-1 d-flex w-100',
            //             children: [
            //                 {
            //                     tag:'div',
            //                     class: ' d-flex flex-column w-50 overflow-auto',
            //                     children: [
            //                         new RunOutputsView(stepStream$.log$),
            //                         data.manifest
            //                             ? new ManifestView(data.manifest)
            //                             : undefined,
            //                     ],
            //                 },
            //                 {
            //                     tag:'div',
            //                     class: 'w-50',
            //                     children: [
            //                         data.artifacts && data.artifacts.length > 0
            //                             ? new ArtifactsView(data.artifacts)
            //                             : undefined,
            //                     ],
            //                 },
            //             ],
            //         }
            //     },
            // ),
        ]
    }
}
