import { dagStratify, decrossOpt, layeringLongestPath, sugiyama } from "d3-dag"
import * as d3 from 'd3'
import { HTMLElement$, VirtualDOM } from "@youwol/flux-view"
import { PipelineStep, PipelineStepStatusResponse, Project } from "../../client/models"
import { combineLatest } from "rxjs"
import { AppState, ProjectEvents } from "../../app-state"



export class DagView implements VirtualDOM {

    public readonly class = "w-100 h-50 mx-auto"
    public readonly project: Project
    public readonly state: AppState

    connectedCallback: (elem: HTMLElement$ & HTMLDivElement) => void

    constructor(params: {
        project: Project,
        state: AppState
    }) {

        Object.assign(this, params)

        this.connectedCallback = (elem: HTMLElement$ & HTMLDivElement) => {
            var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.classList.add('h-100', 'w-100')
            elem.appendChild(svg)

            elem.ownSubscriptions(
                combineLatest([
                    this.state.projectEvents[this.project.id].selectedStep$,
                    this.state.projectEvents[this.project.id].stepsStatus$
                ]).subscribe(([selection, stepsStatus]) => {
                    this.renderDag({ svg, selection, status: stepsStatus })
                })
            )
        }
    }

    createDag(selection: { flowId: string, step: PipelineStep | undefined }) {

        let flowId = selection.flowId
        let flow = this.project.pipeline.flows.find(flow => flow.name == flowId)
        let availableSteps = this.project.pipeline.steps.map(s => s.id)
        let includedSteps = new Set(flow.dag.flatMap((branch) => {
            return branch.split('>').map(elem => elem.trim()).reduce(
                (acc, e) => acc.concat(e),
                [])
        }))
        includedSteps.forEach((stepId) => {
            if (!availableSteps.includes(stepId)) {
                throw Error(`Step ${stepId} not found in the pipeline definition`)
            }
        })
        let parentIds = [...includedSteps].reduce((acc, e) => ({ ...acc, [e]: [] }), {})
        flow.dag.forEach((branch) => {
            branch.split('>').map(elem => elem.trim()).reverse().reduce((acc, e) => {
                acc && parentIds[acc].push(e)
                return e
            }, undefined)
        })
        let data = [...includedSteps].map((stepId) => {
            return { id: stepId, parentIds: parentIds[stepId] }
        })
        return dagStratify()(data)
    }


    renderDag({ svg, selection, status }: {
        svg: SVGElement,
        selection: { flowId: string, step: PipelineStep | undefined },
        status: { [key: string]: PipelineStepStatusResponse }
    }) {

        let dag = this.createDag(selection)

        let flowId = selection.flowId

        const nodeRadius = 20;
        const layout = sugiyama() // base layout
            .layering(layeringLongestPath())
            .decross(decrossOpt()) // minimize number of crossings
            .nodeSize((node) => [(node ? 3.6 : 0.25) * nodeRadius, 3 * nodeRadius]); // set node size instead of constraining to fit

        const { width, height } = layout(dag as any);
        const svgSelection = d3.select(svg);

        svgSelection.selectAll('*').remove();
        svgSelection.attr("viewBox", [0, 0, height * 1.2, width * 1.2].join(" "));
        const defs = svgSelection.append("defs"); // For gradients

        const colorMap = new Map();

        for (const [i, node] of dag.idescendants().entries()) {
            let fullId = ProjectEvents.fullId(flowId, node.data.id)
            let color = status[fullId]
                ? {
                    'none': 'gray',
                    'KO': 'red',
                    'OK': 'green',
                    'outdated': 'orange'
                }[status[fullId].status]
                : 'white'
            colorMap.set(node.data.id, color);
        }

        // How to draw edges
        const line = d3
            .line()
            .curve(d3.curveCatmullRom)
            .x((d) => d.y)
            .y((d) => d.x);

        // Plot edges
        svgSelection
            .append("g")
            .selectAll("path")
            .data(dag.links())
            .enter()
            .append("path")
            .attr("d", ({ points }) => line(points))
            .attr("fill", "none")
            .attr("stroke-width", 3)
            .attr("stroke", ({ source, target }) => {
                // encodeURIComponents for spaces, hope id doesn't have a `--` in it
                let prefix = this.project.name.includes('/')
                    ? this.project.name.split('/').slice(-1)[0]
                    : this.project.name

                const gradId = encodeURIComponent(`${prefix}_${source.data.id}--${prefix}_${target.data.id}`);
                const grad = defs
                    .append("linearGradient")
                    .attr("id", gradId)
                    .attr("gradientUnits", "userSpaceOnUse")
                    .attr("x1", source.y)
                    .attr("x2", target.y)
                    .attr("y1", source.x)
                    .attr("y2", target.x);
                grad
                    .append("stop")
                    .attr("offset", "0%")
                    .attr("stop-color", colorMap.get(source.data.id));
                grad
                    .append("stop")
                    .attr("offset", "100%")
                    .attr("stop-color", colorMap.get(target.data.id));
                return `url(#${gradId})`;
            });

        // Select nodes
        const nodes = svgSelection
            .append("g")
            .selectAll("g")
            .data(dag.descendants())
            .enter()
            .append("g")
            .attr("transform", ({ x, y }) => `translate(${y}, ${x})`);

        // Plot node circles
        nodes
            .append("circle")
            .attr("r", nodeRadius)
            .attr("class", 'fv-pointer fv-hover-xx-lighter')
            .attr("fill", (n) => colorMap.get(n.data.id))
            .attr("stroke", (n) => selection.step && n.data.id == selection.step.id ? 'orange' : 'black')
            .on('click', (n) => {
                this.state.selectStep(this.project.id, flowId, n.data.id)
            })

        // Add titles to nodes
        nodes
            .append("text")
            .text((d) => d.data.id)
            .attr("transform", `translate(0, -${nodeRadius + 10})`)
            .style('user-select', 'none')
            .attr("font-size", "8px")
            .attr("font-weight", "bold")
            .attr("font-family", "sans-serif")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("fill", "white");

        // Add status to nodes
        nodes
            .append("g")
            .append('text')
            .style('user-select', 'none')
            .attr("font-size", "6px")
            .attr("text-anchor", "middle")
            .text((d) => {
                let fullId = ProjectEvents.fullId(flowId, d.data.id)
                if (status[fullId])
                    return status[fullId].status
                return 'pending'
            })
    }
}
