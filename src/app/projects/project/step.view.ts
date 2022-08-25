import { child$, HTMLElement$, VirtualDOM } from '@youwol/flux-view'
import { PyYouwol as pyYw } from '@youwol/http-clients'
import { ArtifactsView } from './artifacts.view'
import { ManifestView } from './manifest.view'
import { RunOutputsView } from './run-outputs.view'
import { ProjectsState } from '../projects.state'

/**
 * @category View
 */
export class StepView implements VirtualDOM {

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
