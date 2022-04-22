import { attr$, child$, HTMLElement$, VirtualDOM } from '@youwol/flux-view'
import { filter, map, mapTo } from 'rxjs/operators'

import { PyYouwol as pyYw, filterCtxMessage } from '@youwol/http-clients'
import { ArtifactsView } from './artifacts.view'
import { ManifestView } from './manifest.view'
import { RunOutputsView } from './run-outputs.view'
import { ProjectsState } from '../projects.state'
import { classesButton } from '../../common/utils-view'
import { merge } from 'rxjs'

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

        const pendingMessages$ = this.projectsState.projectEvents[
            this.project.id
        ].messages$.pipe(
            filterCtxMessage({
                withLabels: ['Label.PIPELINE_STEP_RUNNING'],
                withAttributes: {
                    flowId: this.flowId,
                    stepId: this.step.id,
                },
            }),
        )

        this.children = [
            child$(
                this.projectsState.projectEvents[
                    this.project.id
                ].stepStatusResponse$.pipe(
                    filter(
                        (status) =>
                            status.stepId == this.step.id &&
                            status.flowId == this.flowId,
                    ),
                ),
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
                            new RunOutputsView(pendingMessages$),
                            data.manifest
                                ? new ManifestView(data.manifest)
                                : undefined,
                            data.artifacts.length > 0
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
        const pending$ = this.projectsState.projectEvents[
            this.project.id
        ].messages$.pipe(
            filterCtxMessage({
                withAttributes: {
                    stepId: this.stepId,
                    flowId: this.flowId,
                },
                withLabels: ['Label.STARTED', 'Label.RUN_PIPELINE_STEP'],
            }),
            mapTo('pending'),
        )
        const done$ = this.projectsState.projectEvents[
            this.project.id
        ].stepStatusResponse$.pipe(
            filter((d) => d.stepId == this.stepId),
            map((d) => d['status']),
        )
        const src$ = merge(pending$, done$)
        this.children = [
            {
                class: attr$(
                    src$,
                    (status: string) => statusClassFactory[status],
                    { wrapper: (d) => `${d} mx-2` },
                ),
            },
            {
                class: attr$(src$, (status) =>
                    status == 'pending'
                        ? ''
                        : 'fas fa-play fv-hover-text-secondary fv-pointer mx-3',
                ),
            },
        ]
    }
}
