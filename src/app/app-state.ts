
import { YouwolBannerState } from '@youwol/platform-essentials'
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs'
import {
    distinctUntilChanged,
    filter,
    map,
    mergeMap,
    scan,
    shareReplay,
} from 'rxjs/operators'
import {
    CdnResponse,
    CheckUpdateResponse,
    CheckUpdatesResponse,
    ContextMessage,
    DownloadPackageBody,
    Environment,
    Label,
    PipelineStep,
    PipelineStepStatusResponse,
    Project,
    ProjectLoadingResult,
    ProjectsLoadingResults,
    ProjectStatusResponse,
} from './client/models'
import { PyYouwolClient } from './client/py-youwol.client'

type StepId = string

export function filterCtxMessage<T = unknown>({
    withAttributes,
    withLabels,
}: {
    withAttributes?: {
        [_key: string]: string | ((string) => boolean)
    }
    withLabels?: Label[]
}) {
    withAttributes = withAttributes || {}
    withLabels = withLabels || []
    return (source$: Observable<ContextMessage>) =>
        source$.pipe(
            filter((message: ContextMessage) => {
                const attrsOk =
                    message.attributes &&
                    Object.entries(withAttributes).reduce((acc, [k, v]) => {
                        if (!acc || !message.attributes[k]) {
                            return false
                        }
                        if (typeof v == 'string') {
                            return message.attributes[k] == v
                        }

                        return v(message.attributes[k])
                    }, true)

                const labelsOk =
                    message.labels &&
                    withLabels.reduce(
                        (acc, label) => acc && message.labels.includes(label),
                        true,
                    )

                return attrsOk && labelsOk
            }),
        ) as Observable<ContextMessage<T>>
}

export class UpdateEvents {
    /**
     * All messages related to updates
     */
    messages$: Observable<ContextMessage>

    /**
     * update response on particular package
     */
    updateChecksResponse$: Observable<ContextMessage<CheckUpdateResponse>>

    /**
     * update response on all packages
     */
    updatesChecksResponse$: Observable<ContextMessage<CheckUpdatesResponse>>

    constructor() {
        this.messages$ = PyYouwolClient.connectWs().pipe(
            filterCtxMessage({ withAttributes: { topic: 'updatesCdn' } }),
        )
        this.updateChecksResponse$ = PyYouwolClient.connectWs().pipe(
            filterCtxMessage({
                withAttributes: {
                    topic: 'updatesCdn',
                },
                withLabels: ['CheckUpdateResponse'],
            }),
        )

        this.updatesChecksResponse$ = PyYouwolClient.connectWs().pipe(
            filterCtxMessage({
                withAttributes: {
                    topic: 'updatesCdn',
                },
                withLabels: ['CheckUpdatesResponse'],
            }),
        )
    }
}

export class ProjectEvents {
    /**
     * All messages related to the project
     */
    messages$: Observable<ContextMessage>

    selectedStep$: BehaviorSubject<{
        flowId: string | undefined
        step: PipelineStep | undefined
    }>

    stepsStatus$: Observable<Record<StepId, PipelineStepStatusResponse>>
    stepStatusResponse$: Observable<PipelineStepStatusResponse>

    projectStatusResponse$ = new ReplaySubject<ProjectStatusResponse>(1)
    cdnResponse$ = new ReplaySubject<CdnResponse>(1)

    constructor(public readonly project: Project) {
        this.messages$ = PyYouwolClient.connectWs().pipe(
            filterCtxMessage({
                withAttributes: { projectId: this.project.id },
            }),
        )

        this.selectedStep$ = new BehaviorSubject<{
            flowId: string
            step: PipelineStep | undefined
        }>({
            flowId: this.project.pipeline.flows[0].name,
            step: undefined,
        })

        this.stepStatusResponse$ = this.messages$.pipe(
            filterCtxMessage<PipelineStepStatusResponse>({
                withLabels: ['PipelineStepStatusResponse'],
            }),
            map((message) => message.data),
            shareReplay(1),
        )

        this.stepsStatus$ = this.messages$.pipe(
            filter((message: ContextMessage) => {
                return message.labels.includes('PipelineStepStatusResponse')
            }),
            scan((acc, message) => {
                const flowId = message.attributes['flowId']
                const stepId = message.attributes['stepId']

                return {
                    ...acc,
                    [ProjectEvents.fullId(flowId, stepId)]: message.data,
                }
            }, {}),
            shareReplay(1),
        )

        this.selectedStep$
            .pipe(
                distinctUntilChanged((x, y) => x.flowId == y.flowId),
                filter(({ flowId }) => flowId != undefined),
                mergeMap(({ flowId }) => {
                    return PyYouwolClient.projects.getFlowStatus$(
                        project.id,
                        flowId,
                    )
                }),
            )
            .subscribe()

        this.selectedStep$
            .pipe(
                filter(({ step }) => step != undefined),
                mergeMap(({ flowId, step }) => {
                    return PyYouwolClient.projects.getStepStatus$(
                        project.id,
                        flowId,
                        step.id,
                    )
                }),
            )
            .subscribe()

        this.messages$
            .pipe(
                filter((message) =>
                    message.labels.includes('ProjectStatusResponse'),
                ),
                map((message) => message.data as ProjectStatusResponse),
            )
            .subscribe((data) => {
                this.projectStatusResponse$.next(data)
            })

        this.messages$
            .pipe(
                filter((message) => message.labels.includes('CdnResponse')),
                map((message) => message.data as CdnResponse),
            )
            .subscribe((data) => {
                this.cdnResponse$.next(data)
            })

        PyYouwolClient.projects.getProjectStatus$(project.id).subscribe()
    }

    static fullId(flowId: string, stepId: string) {
        return `${flowId}#${stepId}`
    }
}

export type Topic = 'Projects' | 'Updates' | 'CDN'

export class AppState {
    public readonly environment$: Observable<Environment>
    public readonly projectsLoading$: Observable<ProjectLoadingResult[]>
    public readonly topBannerState = new YouwolBannerState({
        cmEditorModule$: undefined,
    })
    public readonly openProjects$ = new BehaviorSubject<Project[]>([])
    public readonly selectedTabId$ = new BehaviorSubject<string>('dashboard')

    public readonly projectEvents: Record<string, ProjectEvents> = {}

    public readonly selectedTopic$ = new BehaviorSubject<Topic>('Projects')
    public readonly updatesEvents = new UpdateEvents()
    public readonly downloadQueue$ = new BehaviorSubject<DownloadPackageBody[]>(
        [],
    )

    constructor() {
        this.environment$ = PyYouwolClient.connectWs().pipe(
            filter(({ labels, data }) => {
                return (
                    labels &&
                    data &&
                    labels.includes('EnvironmentStatusResponse')
                )
            }),
            map(({ data }) => data as Environment),
            shareReplay(1),
        )

        this.projectsLoading$ = PyYouwolClient.connectWs().pipe(
            filter(({ labels, data }) => {
                return (
                    labels && data && labels.includes('ProjectsLoadingResults')
                )
            }),
            map(({ data }) => (data as ProjectsLoadingResults).results),
            shareReplay(1)
        )

        PyYouwolClient.environment.status$().subscribe()
    }

    selectTopic(topic: Topic) {
        this.selectedTopic$.next(topic)
    }

    selectTab(tabId: string) {
        this.selectedTabId$.next(tabId)
    }

    openProject(project: Project) {
        if (!this.projectEvents[project.id]) {
            this.projectEvents[project.id] = new ProjectEvents(project)
        }

        const openProjects = this.openProjects$.getValue()

        if (!openProjects.includes(project)) {
            this.openProjects$.next([...openProjects, project])
        }

        this.selectedTabId$.next(project.id)
    }

    closeProject(projectId: string) {
        delete this.projectEvents[projectId]
        this.selectedTabId$.next('dashboard')

        const openProjects = this.openProjects$.getValue()
        this.openProjects$.next(openProjects.filter((p) => p.id != projectId))
    }

    selectStep(
        projectId: string,
        flowId: string | undefined = undefined,
        stepId: string | undefined = undefined,
    ) {
        const events = this.projectEvents[projectId]
        const step = events.project.pipeline.steps.find((s) => s.id == stepId)
        events.selectedStep$.next({ flowId, step })
    }

    collectUpdates() {
        PyYouwolClient.localCdn.triggerCollectUpdates()
    }

    insertInDownloadQueue(packageName: string, version: string) {
        const queued = this.downloadQueue$.getValue()
        this.downloadQueue$.next([
            ...queued.filter(
                (v) => v.packageName != packageName && v.version != version,
            ),
            { packageName, version },
        ])
    }

    removeFromDownloadQueue(packageName: string, version: string) {
        const queued = this.downloadQueue$.getValue()
        this.downloadQueue$.next([
            ...queued.filter(
                (v) => v.packageName != packageName && v.version != version,
            ),
        ])
    }

    toggleInDownloadQueue(packageName: string, version: string) {
        const queued = this.downloadQueue$.getValue()
        const base = queued.filter(
            (v) => v.packageName != packageName && v.version != version,
        )

        queued.find((v) => v.packageName == packageName && v.version == version)
            ? this.downloadQueue$.next(base)
            : this.downloadQueue$.next([...base, { packageName, version }])
    }

    proceedDownloads() {
        PyYouwolClient.localCdn.download({
            packages: this.downloadQueue$.getValue(),
        })
    }
}
