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
        parentIds: { [k: string]: string[] }
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
                transform: ({ x, y }) => `translate(${y}, ${x})`,
            },
            style: {},
            on: {
                click: (n) =>
                    this.projectsState.selectStep(
                        this.project.id,
                        this.flowId,
                        n.data.id,
                    ),
            },
        },
        circle: {
            attributes: {
                r: DagFlowView.nodeRadius,
                id: (n) => this.flowId + '_' + n.data.id,
                class: 'fv-pointer fv-hover-xx-lighter',
                fill: 'white',
            },
            style: {},
        },
        title: {
            attributes: {
                class: 'fv-pointer fv-hover-xx-lighter',
                'font-size': '8px',
                'font-weight': 'bold',
                'font-family': 'sans-serif',
                'text-anchor': 'middle',
                'alignment-baseline': 'middle',
                fill: 'white',
                transform: `translate(0, -${DagFlowView.nodeRadius + 10})`,
            },
            style: {
                'user-select': 'none',
            },
        },
        status: {
            attributes: {
                class: 'fv-pointer fv-hover-xx-lighter status',
                'font-size': '16px',
                'text-anchor': 'middle',
            },
            style: {
                'user-select': 'none',
                transform: 'translateY(5px)',
                'pointer-events': 'auto',
            },
            on: {
                mouseenter: (n) => toggleHighlight(this.flowId, n.data.id),
                mouseleave: (n) => toggleHighlight(this.flowId, n.data.id),
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
            this.renderDag({
                svg,
                //status: stepsStatus,
            })
            const events$ = Array.from(this.dag.includedSteps).map((stepId) => {
                const d3Svg = d3.select(svg)
                return combineLatest([
                    this.projectsState.projectEvents[this.project.id]
                        .getStep$(this.flowId, stepId)
                        .status$.pipe(
                            map((status) => ({
                                status,
                                stepId,
                                circle: d3Svg.select(
                                    `g#${this.flowId}_${stepId} > circle`,
                                ),
                                text: d3Svg.select(
                                    `g#${this.flowId}_${stepId} .status`,
                                ),
                            })),
                        ),
                    this.projectsState.projectEvents[this.project.id]
                        .selectedStep$,
                ])
            })
            elem.ownSubscriptions(
                merge(...events$).subscribe(([event, selected]) => {
                    applyStyle(selected, event)
                }),
            )
        }
    }

    createDag() {
        const flowId = this.flowId
        const flow = this.project.pipeline.flows.find((f) => f.name == flowId)
        const { includedSteps, parentIds } = this.dag

        flow.dag.forEach((branch) => {
            let previous = undefined
            branch
                .split('>')
                .map((elem) => elem.trim())
                .reverse()
                .forEach((e) => {
                    previous && parentIds[previous].push(e)
                    previous = e
                })
        })
        const data = [...includedSteps].map((stepId) => {
            return { id: stepId, parentIds: parentIds[stepId] }
        })
        return dagStratify()(data)
    }

    renderDag({ svg }: { svg: SVGElement }) {
        let withDefaultStyleAttributes = (n, data) => {
            data.attributes &&
                Object.entries(data.attributes).forEach(([k, v]) => {
                    n = n.attr(k, v)
                })
            data.style &&
                Object.entries(data.style).forEach(([k, v]) => {
                    n = n.style(k, v)
                })
            data.on &&
                Object.entries(data.on).forEach(([k, v]) => {
                    n = n.on(k, v)
                })
            return n
        }

        const dag = this.createDag()
        const nodeRadius = 20
        const layout = sugiyama()
            .layering(layeringLongestPath())
            // minimize number of crossings
            .decross(decrossOpt())
            // set node size instead of constraining to fit
            .nodeSize((n) => [(n ? 3.6 : 0.25) * nodeRadius, 3 * nodeRadius])

        const { width, height } = layout(dag as any)
        const svgSelection = d3.select(svg)

        svgSelection.selectAll('*').remove()
        svgSelection.attr(
            'viewBox',
            [0, 0, height * 1.2, width * 1.2].join(' '),
        )
        const defs = svgSelection.append('defs') // For gradients

        const colorMap = new Map()

        for (const [, n] of dag.idescendants().entries()) {
            colorMap.set(n.data.id, 'white')
        }

        // How to draw edges
        const line = d3
            .line()
            .curve(d3.curveCatmullRom)
            .x((d) => d.y)
            .y((d) => d.x)

        // Plot edges
        svgSelection
            .append('g')
            .selectAll('path')
            .data(dag.links())
            .enter()
            .append('path')
            .attr('d', ({ points }) => line(points))
            .attr('fill', 'none')
            .attr('stroke-width', 3)
            .attr('stroke', ({ source, target }) => {
                // encodeURIComponents for spaces, hope id doesn't have a `--` in it
                const prefix = this.project.name.includes('/')
                    ? this.project.name.split('/').slice(-1)[0]
                    : this.project.name

                const gradId = encodeURIComponent(
                    `${prefix}_${source.data.id}--${prefix}_${target.data.id}`,
                )
                const grad = defs
                    .append('linearGradient')
                    .attr('id', gradId)
                    .attr('gradientUnits', 'userSpaceOnUse')
                    .attr('x1', source.y)
                    .attr('x2', target.y)
                    .attr('y1', source.x)
                    .attr('y2', target.x)
                grad.append('stop')
                    .attr('offset', '0%')
                    .attr('stop-color', colorMap.get(source.data.id))
                grad.append('stop')
                    .attr('offset', '100%')
                    .attr('stop-color', colorMap.get(target.data.id))
                return `url(#${gradId})`
            })

        // Select nodes
        const nodes = withDefaultStyleAttributes(
            svgSelection
                .append('g')
                .selectAll('g')
                .data(dag.descendants())
                .enter()
                .append('g'),
            this.defaultStyle.group,
        )

        withDefaultStyleAttributes(
            nodes.append('circle'),
            this.defaultStyle.circle,
        )

        // Add titles to nodes
        withDefaultStyleAttributes(
            nodes
                .append('text')
                .text((d) => d.data.id)
                .on('click', onclick),
            this.defaultStyle.title,
        )

        withDefaultStyleAttributes(
            nodes.append('g').append('text'),
            this.defaultStyle.status,
        )
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
    const parentIds = [...includedSteps].reduce(
        (acc, e) => ({ ...acc, [e]: [] }),
        {},
    )
    return {
        includedSteps,
        parentIds,
    }
}

function applyStyle(
    selected: { flowId: string; step: pyYw.PipelineStep },
    event: { stepId; status; circle: d3.selection; text: d3.selection },
) {
    const baseClass = 'fv-pointer fv-hover-xx-lighter'
    const selectedClass =
        selected.step && selected.step.id == event.stepId ? 'fv-xx-lighter' : ''
    const pendingClass = instanceOfStepStatus(event.status) ? '' : 'pending'
    event.circle.attr('class', `${baseClass} ${selectedClass} ${pendingClass}`)
    event.circle.attr(
        'r',
        selected.step && selected.step.id == event.stepId ? '25px' : '20px',
    )
    if (instanceOfStepStatus(event.status))
        event.circle.attr(
            'fill',
            DagFlowView.colorsFactory[event.status.status],
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
}

function toggleHighlight(flowId: string, stepId: string) {
    document
        .getElementById(flowId + '_' + stepId)
        .classList.toggle('fv-xx-lighter')
}
