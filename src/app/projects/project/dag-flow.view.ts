import { HTMLElement$, VirtualDOM } from '@youwol/flux-view'
import * as d3 from 'd3'
import { dagStratify, decrossOpt, layeringLongestPath, sugiyama } from 'd3-dag'
import { combineLatest, merge } from 'rxjs'
import { PyYouwol as pyYw } from '@youwol/http-clients'
import { instanceOfStepStatus, ProjectsState } from '../projects.state'
import { map } from 'rxjs/operators'

export class DagFlowView implements VirtualDOM {
    public readonly class = 'w-75 h-50 mx-auto'
    public readonly project: pyYw.Project
    public readonly projectsState: ProjectsState
    public readonly flowId: string
    public readonly dag: {
        includedSteps: Set<string>
        data: { id: string; parentIds: string[] }[]
    }
    static colorsFactory = {
        none: 'gray',
        KO: 'red',
        OK: 'green',
        outdated: 'orange',
    }
    connectedCallback: (elem: HTMLElement$ & HTMLDivElement) => void

    static nodeRadius = 20
    defaultStyle = {
        group: {
            attributes: {
                id: (d) => this.flowId + '_' + d.data.id,
                class: 'fv-hover-xx-lighter fv-pointer',
                transform: ({ x, y }) => `translate(${y}, ${x})`,
            },
            style: {},
            on: {
                click: (n) => {
                    this.projectsState.selectStep(
                        this.project.id,
                        this.flowId,
                        n.data.id,
                    )
                    d3.event.stopPropagation()
                },
            },
        },
        link: {
            attributes: {
                d: ({ points }) => {
                    const line = d3
                        .line()
                        .curve(d3.curveCatmullRom)
                        .x((d) => d.y)
                        .y((d) => d.x)
                    return line(points)
                },
                class: 'fv-pointer dag-flow-link',
            },
        },
        thumbnail: {
            attributes: {
                class: 'thumbnail',
            },
        },
        circle: {
            attributes: {
                r: DagFlowView.nodeRadius,
                class: 'fv-pointer',
                fill: 'white',
                stroke: 'white',
            },
            style: {},
        },
        title: {
            attributes: {
                class: 'fv-pointer dag-flow-node-title',
                transform: `translate(0, -${DagFlowView.nodeRadius + 10})`,
            },
            style: {
                'user-select': 'none',
            },
        },
        status: {
            attributes: {
                class: 'fv-pointer  dag-flow-node-status',
            },
        },
        run: {
            attributes: {
                class: 'fv-pointer dag-flow-node-run d-none fv-hover-xx-darker',
            },
            on: {
                click: (n) => {
                    d3.event.stopPropagation()
                    this.projectsState.runStep(
                        this.project.id,
                        this.flowId,
                        n.data.id,
                    )
                },
            },
        },
    }

    constructor(params: {
        project: pyYw.Project
        projectsState: ProjectsState
        flowId: string
    }) {
        Object.assign(this, params)
        this.dag = parseDag(this.project, this.flowId)
        this.connectedCallback = (elem: HTMLElement$ & HTMLDivElement) => {
            const svg = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'svg',
            )
            svg.classList.add('h-100', 'w-100')
            elem.appendChild(svg)
            this.renderDag(svg)
            const events$ = Array.from(this.dag.includedSteps).map((stepId) => {
                const d3Svg = d3.select(svg)
                return combineLatest([
                    this.projectsState.projectEvents[this.project.id]
                        .getStep$(this.flowId, stepId)
                        .status$.pipe(
                            map((status) => ({
                                status,
                                stepId,
                                groupThumbnail: d3Svg.select(
                                    `g#${this.flowId}_${stepId} > g.thumbnail`,
                                ),
                                circle: d3Svg.select(
                                    `g#${this.flowId}_${stepId} circle`,
                                ),
                                text: d3Svg.select(
                                    `g#${this.flowId}_${stepId} .dag-flow-node-status`,
                                ),
                                run: d3Svg.select(
                                    `g#${this.flowId}_${stepId} .dag-flow-node-run`,
                                ),
                            })),
                        ),
                    this.projectsState.projectEvents[this.project.id]
                        .selectedStep$,
                ])
            })
            elem.ownSubscriptions(
                merge(...events$).subscribe(([event, selected]) => {
                    this.applyStyle(selected, event)
                }),
            )
        }
    }

    renderDag(svg: SVGElement) {
        let withDefaultStyleAttributes = (n, data) => {
            Object.entries(data.attributes || {}).forEach(([k, v]) => {
                n = n.attr(k, v)
            })
            Object.entries(data.style || {}).forEach(([k, v]) => {
                n = n.style(k, v)
            })
            Object.entries(data.on || {}).forEach(([k, v]) => {
                n = n.on(k, v)
            })
            return n
        }

        const dag = dagStratify()(this.dag.data)

        const layout = sugiyama()
            .layering(layeringLongestPath())
            // minimize number of crossings
            .decross(decrossOpt())
            // set node size instead of constraining to fit
            .nodeSize((n) => [
                (n ? 3.6 : 0.25) * DagFlowView.nodeRadius,
                3 * DagFlowView.nodeRadius,
            ])

        const { width, height } = layout(dag as any)
        const svgSelection = d3
            .select(svg)
            .on('click', () =>
                this.projectsState.selectStep(this.project.id, this.flowId),
            )
        svgSelection.attr(
            'viewBox',
            [0, 0, height * 1.2, width * 1.2].join(' '),
        )

        withDefaultStyleAttributes(
            svgSelection
                .append('g')
                .selectAll('path')
                .data(dag.links())
                .enter()
                .append('path'),
            this.defaultStyle.link,
        )

        const nodes = withDefaultStyleAttributes(
            svgSelection
                .append('g')
                .selectAll('g')
                .data(dag.descendants())
                .enter()
                .append('g'),
            this.defaultStyle.group,
        )

        let nodesThumbnail = withDefaultStyleAttributes(
            nodes.append('g').attr('class', 'thumbnail'),
            this.defaultStyle.thumbnail,
        )
        withDefaultStyleAttributes(
            nodesThumbnail.append('circle'),
            this.defaultStyle.circle,
        )
        withDefaultStyleAttributes(
            nodes
                .append('text')
                .text((d) => d.data.id)
                .on('click', onclick),
            this.defaultStyle.title,
        )
        withDefaultStyleAttributes(
            nodes.append('text'),
            this.defaultStyle.status,
        )

        withDefaultStyleAttributes(
            nodes.append('text').text('▶'),
            this.defaultStyle.run,
        )
    }

    applyStyle(
        selected: { flowId: string; step: pyYw.PipelineStep },
        event: {
            stepId
            status
            groupThumbnail: d3.selection
            circle: d3.selection
            text: d3.selection
            run: d3.selection
        },
    ) {
        const isSelected = selected.step && selected.step.id == event.stepId
        const selectedClass = isSelected ? 'fv-xx-lighter' : ''
        const pendingClass = instanceOfStepStatus(event.status) ? '' : 'pending'
        event.circle.attr(
            'class',
            `${this.defaultStyle.circle.attributes.class} ${selectedClass} ${pendingClass}`,
        )
        event.circle.attr(
            'r',
            selected.step && selected.step.id == event.stepId ? '25px' : '20px',
        )
        if (instanceOfStepStatus(event.status))
            event.circle.attr(
                'fill',
                DagFlowView.colorsFactory[event.status.status],
            )

        event.groupThumbnail.attr(
            'class',
            `${this.defaultStyle.thumbnail.attributes.class} ${pendingClass}`,
        )

        let factoryPending: Record<pyYw.PipelineStepEventKind, string> = {
            runStarted: '▶',
            runDone: '',
            statusCheckStarted: '',
        }
        let factoryDone: Record<'OK' | 'KO' | 'outdated' | 'none', string> = {
            OK: '✔',
            KO: '❌',
            outdated: '⚠',
            none: '',
        }
        event.text.text(
            instanceOfStepStatus(event.status)
                ? factoryDone[event.status.status]
                : factoryPending[event.status],
        )
        if (isSelected) {
            event.run.attr(
                'class',
                `${this.defaultStyle.run.attributes.class} d-block`,
            )
            event.text.attr(
                'class',
                `${this.defaultStyle.status.attributes.class}  d-none`,
            )
        } else {
            event.run.attr(
                'class',
                `${this.defaultStyle.run.attributes.class} d-none`,
            )
            event.text.attr(
                'class',
                `${this.defaultStyle.status.attributes.class}  d-block`,
            )
        }
    }
}

function parseDag(project: pyYw.Project, flowId: string) {
    const flow = project.pipeline.flows.find((f) => f.name == flowId)
    const availableSteps = project.pipeline.steps.map((s) => s.id)
    const includedSteps = new Set(
        flow.dag.flatMap((branch) => {
            return branch
                .split('>')
                .map((elem) => elem.trim())
                .reduce((acc, e) => acc.concat(e), [])
        }),
    )
    includedSteps.forEach((stepId) => {
        if (!availableSteps.includes(stepId)) {
            throw Error(`Step ${stepId} not found in the pipeline definition`)
        }
    })
    const parentIds: { [k: string]: string[] } = [...includedSteps].reduce(
        (acc, e) => ({ ...acc, [e]: [] }),
        {},
    )
    flow.dag.forEach((branch) => {
        let previous = undefined
        branch
            .split('>')
            .map((elem) => elem.trim())
            .reverse()
            .forEach((e: string) => {
                previous && parentIds[previous].push(e)
                previous = e
            })
    })
    const data = [...includedSteps].map((stepId: string) => {
        return { id: stepId, parentIds: parentIds[stepId] }
    })
    return {
        includedSteps,
        data,
    }
}
