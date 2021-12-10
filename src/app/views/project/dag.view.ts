import { dagStratify, decrossOpt, layeringLongestPath, sugiyama } from "d3-dag"
import * as d3 from 'd3'
import { HTMLElement$, VirtualDOM } from "@youwol/flux-view"
import { Project } from "src/app/client/models"



export class DagView implements VirtualDOM {


    public readonly class = "w-100 h-100 mx-auto"
    public readonly project: Project

    connectedCallback: (elem: HTMLElement$ & HTMLDivElement) => void

    constructor(params: { project: Project, selectedStep$ }) {

        Object.assign(this, params)

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
            renderDag({ svg, data, step$: params.selectedStep$ })
        }
    }
}




export function renderDag({ svg, data, step$ }: {
    svg: SVGElement,
    data: any,
    step$: any
}) {
    let dag = dagStratify()(data)
    const nodeRadius = 20;
    const layout = sugiyama() // base layout
        .layering(layeringLongestPath())
        .decross(decrossOpt()) // minimize number of crossings
        .nodeSize((node) => [(node ? 3.6 : 0.25) * nodeRadius, 3 * nodeRadius]); // set node size instead of constraining to fit

    const { width, height } = layout(dag as any);
    const svgSelection = d3.select(svg);

    svgSelection.attr("viewBox", [0, 0, height * 1.2, width * 1.2].join(" "));
    const defs = svgSelection.append("defs"); // For gradients

    const steps = dag.size();
    const interp = d3.interpolateRainbow;
    const colorMap = new Map();
    for (const [i, node] of dag.idescendants().entries()) {
        colorMap.set(node.data.id, interp(i / steps));
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

    // Add text to nodes
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

    let iconGrp = nodes
        .append("g")
    iconGrp.append("path")
        .attr("class", `fv-pointer fv-hover-fill-focus`)
        .attr("transform", `scale(0.02) translate(-500,-150)`)
        .attr('d', (d) => "M37.728,328.12c2.266,1.256,4.77,1.88,7.272,1.88c2.763,0,5.522-0.763,7.95-2.28l240-149.999  c4.386-2.741,7.05-7.548,7.05-12.72c0-5.172-2.664-9.979-7.05-12.72L52.95,2.28c-4.625-2.891-10.453-3.043-15.222-0.4  C32.959,4.524,30,9.547,30,15v300C30,320.453,32.959,325.476,37.728,328.12z")

    iconGrp.append("path")
        .attr("class", `fv-pointer fv-hover-fill-focus`)
        .attr("transform", `scale(0.17) translate(0,-30)`)
        .attr('d', (d) => "M64.702,30.366L37.12,14.442c-0.995-0.574-2.221-0.574-3.217,0s-1.609,1.639-1.609,2.787v13.072L4.827,14.442   c-0.997-0.574-2.222-0.574-3.218,0S0,16.081,0,17.229v31.849c0,1.148,0.613,2.211,1.609,2.785c0.498,0.287,1.053,0.432,1.608,0.432   s1.111-0.145,1.609-0.432l27.466-15.857v13.072c0,1.148,0.612,2.211,1.608,2.785c0.498,0.287,1.055,0.432,1.609,0.432   s1.111-0.145,1.607-0.432l27.582-15.924c0.996-0.574,1.609-1.637,1.609-2.787C66.311,32.004,65.698,30.94,64.702,30.366z")


}
