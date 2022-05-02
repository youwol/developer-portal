import { attr$, child$, HTMLElement$, VirtualDOM } from '@youwol/flux-view'
import { PyYouwol as pyYw } from '@youwol/http-clients'
import { ArtifactsView } from './artifacts.view'
import { ManifestView } from './manifest.view'
import { RunOutputsView } from './run-outputs.view'
import { instanceOfStepStatus, ProjectsState } from '../projects.state'
import { classesButton } from '../../common/utils-view'

export class StepView implements VirtualDOM {
    public readonly class = 'w-50 h-100 d-flex flex-column px-2'

    public readonly children: VirtualDOM[]

    public readonly projectsState: ProjectsState
    public readonly project: pyYw.Project
    public readonly flowId: string
    public readonly step: pyYw.PipelineStep

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
                        class: 'flex-grow-1 d-flex flex-column',
                        children: [
                            new RunStepBtn({
                                project: this.project,
                                projectsState: this.projectsState,
                                flowId: this.flowId,
                                stepId: this.step.id,
                            }),
                            new RunOutputsView(stepStream$.log$),
                            data.manifest
                                ? new ManifestView(data.manifest)
                                : undefined,
                            data.artifacts && data.artifacts.length > 0
                                ? new ArtifactsView(data.artifacts)
                                : undefined,
                        ],
                    }
                },
            ),
        ]
    }
}

type StepStatus = 'OK' | 'KO' | 'outdated' | 'none' | 'pending'

const statusClassFactory: Record<StepStatus, string> = {
    OK: 'fas fa-check fv-text-success',
    KO: 'fas fa-times fv-text-error',
    outdated: 'fas fa-sync-alt fv-text-secondary',
    none: 'fas fa-ban fv-text-disabled',
    pending: 'fas fa-spinner fa-spin',
}

class RunStepBtn implements VirtualDOM {
    public readonly class = classesButton + ' mx-auto'
    public readonly style = {
        width: 'fit-content',
    }
    public readonly innerText: string
    public readonly projectsState: ProjectsState
    public readonly project: pyYw.Project
    public readonly stepId: string
    public readonly flowId: string
    public readonly children: VirtualDOM[]
    public readonly onclick = () =>
        this.projectsState.runStep(this.project.id, this.flowId, this.stepId)

    constructor(params: {
        projectsState: ProjectsState
        project: pyYw.Project
        flowId: string
        stepId: string
    }) {
        Object.assign(this, params)
        this.innerText = this.stepId
        const status$ = this.projectsState.projectEvents[
            this.project.id
        ].getStep$(this.flowId, this.stepId).status$
        this.children = [
            {
                class: attr$(
                    status$,
                    (status) => {
                        return instanceOfStepStatus(status)
                            ? statusClassFactory[status.status]
                            : statusClassFactory['pending']
                    },
                    { wrapper: (d) => `${d} mx-2` },
                ),
            },
            {
                class: attr$(status$, (status) =>
                    instanceOfStepStatus(status)
                        ? 'fas fa-play fv-hover-text-secondary fv-pointer mx-3'
                        : '',
                ),
            },
        ]
    }
}
