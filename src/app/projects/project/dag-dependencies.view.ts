import { attr$, HTMLElement$, VirtualDOM } from '@youwol/flux-view'
import * as d3 from 'd3'
import { dagStratify, decrossOpt, layeringLongestPath, sugiyama } from 'd3-dag'
import { BehaviorSubject, combineLatest } from 'rxjs'
import { PyYouwol as pyYw } from '@youwol/http-clients'
import { ProjectsState } from '../projects.state'

export class DagDependenciesView implements VirtualDOM {
    public readonly class = 'w-100 h-50 mx-auto d-flex flex-column'
    public readonly children: VirtualDOM[]
    public readonly project: pyYw.Project
    public readonly projectsState: ProjectsState

    public readonly mode$ = new BehaviorSubject<'dag' | 'simpleDag'>(
        'simpleDag',
    )

    connectedCallback: (elem: HTMLElement$ & HTMLDivElement) => void

    constructor(params: {
        project: pyYw.Project
        projectsState: ProjectsState
    }) {
        Object.assign(this, params)
        const class$ = (mode: 'dag' | 'simpleDag') => {
            return attr$(
                this.mode$,
                (m): string => (m == mode ? 'fv-bg-secondary' : ''),
                {
                    wrapper: (d) =>
                        `${d} border rounded p-1 mx-2 fv-hover-xx-lighter fv-pointer`,
                },
            )
        }
        this.children = [
            {
                class: 'd-flex align-items-center mx-auto',
                children: [
                    {
                        class: class$('simpleDag'),
                        innerText: 'Simple Dag',
                        onclick: () => this.mode$.next('simpleDag'),
                    },
                    {
                        class: class$('dag'),
                        innerText: 'Full Dag',
                        onclick: () => this.mode$.next('dag'),
                    },
                ],
            },
            {
                class: 'flex-grow-1 w-100',
                style: {
                    minHeight: '0px',
                },
                connectedCallback: (elem: HTMLElement$ & HTMLDivElement) => {
                    const svg = document.createElementNS(
                        'http://www.w3.org/2000/svg',
                        'svg',
                    )
                    svg.classList.add('h-100', 'w-100')
                    elem.appendChild(svg)

                    elem.ownSubscriptions(
                        combineLatest([
                            this.projectsState.projectEvents[this.project.id]
                                .projectStatusResponse$,
                            this.mode$,
                        ]).subscribe(
                            ([status, mode]: [
                                pyYw.GetProjectStatusResponse,
                                'dag' | 'simpleDag',
                            ]) => {
                                this.renderDag({
                                    svg,
                                    dagData: status.workspaceDependencies[mode],
                                })
                            },
                        ),
                    )
                },
            },
        ]
    }

    renderDag({
        svg,
        dagData,
    }: {
        svg: SVGElement
        dagData: pyYw.ChildToParentConnections[]
    }) {
        const dag = dagStratify()(dagData)
        const nodeRadius = 20
        const layout = sugiyama() // base layout
            .layering(layeringLongestPath())
            .decross(decrossOpt()) // minimize number of crossings
            .nodeSize((node) => [
                (node ? 3.6 : 0.25) * nodeRadius,
                3 * nodeRadius,
            ]) // set node size instead of constraining to fit

        const { width, height } = layout(dag as any)
        const svgSelection = d3.select(svg)

        svgSelection.selectAll('*').remove()
        svgSelection.attr(
            'viewBox',
            [0, 0, height * 1.2, width * 1.2].join(' '),
        )

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
            .attr('stroke', 'black')

        // Select nodes
        const nodes = svgSelection
            .append('g')
            .selectAll('g')
            .data(dag.descendants())
            .enter()
            .append('g')
            .attr('transform', ({ x, y }) => `translate(${y}, ${x})`)

        nodes
            .append('g')
            .append('text')
            .attr('class', (n) =>
                n.data.id == this.project.name
                    ? 'fv-fill-focus'
                    : 'fv-fill-primary',
            )
            .style('user-select', 'none')
            .attr('font-size', '6px')
            .attr('text-anchor', 'middle')
            .text((d) => {
                return d.data.id.split('/').slice(-1)[0]
            })
    }
}
