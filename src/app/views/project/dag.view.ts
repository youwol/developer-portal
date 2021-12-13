import { dagStratify, decrossOpt, layeringLongestPath, sugiyama } from "d3-dag"
import * as d3 from 'd3'
import { HTMLElement$, VirtualDOM } from "@youwol/flux-view"
import { ContextMessage, PipelineStepStatusResponse, Project } from "src/app/client/models"
import { Observable } from "rxjs"
import { PyYouwolClient } from "../../client/py-youwol.client"
import { filter, scan, tap } from "rxjs/operators"



export class DagView implements VirtualDOM {


    public readonly class = "w-100 h-100 mx-auto"
    public readonly project: Project

    connectedCallback: (elem: HTMLElement$ & HTMLDivElement) => void

    constructor(params: { project: Project, selectedStep$ }) {

        Object.assign(this, params)

        let statusMessages$: Observable<{ [key: string]: PipelineStepStatusResponse }> =
            PyYouwolClient.connectWs().pipe(
                filter((message: ContextMessage) => {
                    return message.labels.includes("PipelineStepStatusResponse")
                }),
                scan((acc, message) => {
                    return { ...acc, [message.attributes['stepId']]: message.data }
                }, {})
            )

        statusMessages$.subscribe()
        let parentIds = this.project.pipeline.steps.reduce((acc, e) => ({ ...acc, [e.id]: [] }), {})

        this.project.pipeline.flow.forEach((branch) => {
            branch.split('>').map(elem => elem.trim()).reverse().reduce((acc, e) => {
                acc && parentIds[acc].push(e)
                return e
            }, undefined)
        })
        let data = this.project.pipeline.steps.map((step) => {
            return { id: step.id, parentIds: parentIds[step.id], step }
        })

        this.connectedCallback = (elem: HTMLElement$ & HTMLDivElement) => {
            var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.classList.add('h-100', 'w-100')
            elem.appendChild(svg)
            statusMessages$.subscribe(status => {
                renderDag({ svg, data, step$: params.selectedStep$, status: status })
            })
        }
    }
}




export function renderDag({ svg, data, step$, status }: {
    svg: SVGElement,
    data: any,
    step$: any,
    status: { [key: string]: PipelineStepStatusResponse }
}) {
    let dag = dagStratify()(data)
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
        let color = status[node.data.id]
            ? {
                'none': 'gray',
                'KO': 'red',
                'OK': 'green',
                'outdated': 'orange'
            }[status[node.data.id].status]
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
            const gradId = encodeURIComponent(`${source.data.id}--${target.data.id}`);
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
        .on('click', (n) => step$.next(n.data.step))

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
            if (status[d.data.id])
                return status[d.data.id].status
            return 'pending'
        })
}
