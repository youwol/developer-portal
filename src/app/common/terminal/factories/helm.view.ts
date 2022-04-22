import { child$, VirtualDOM } from '@youwol/flux-view'
import { ImmutableTree } from '@youwol/fv-tree'
import { Subject } from 'rxjs'
import { mergeMap } from 'rxjs/operators'
import { PyYouwol as pyYw } from '@youwol/http-clients'

class ChartNode extends ImmutableTree.Node {
    name: string

    constructor({ id, name, children }) {
        super({ id, children })
        this.name = name
    }
}
class FileNode extends ChartNode {
    constructor({ id, name }) {
        super({ id, name, children: undefined })
    }
}

class FolderNode extends ChartNode {
    static getChildren(data, id) {
        const foldersNode = data[id].folders.map((folder) => {
            return new FolderNode({ id: folder.path, name: folder.name, data })
        })
        const filesNode = data[id].files.map((file) => {
            return new FileNode({ id: file.path, name: file.name })
        })
        return [...foldersNode, ...filesNode]
    }

    constructor({ id, name, data }) {
        super({ id, name, children: FolderNode.getChildren(data, id) })
    }
}

export class ChartExplorerView implements VirtualDOM {
    public readonly children: VirtualDOM[]
    public readonly selectedFile$ = new Subject<FileNode>()
    public readonly class =
        'd-flex w-100 h-100 justify-content-around p-3 border '

    constructor(data) {
        console.log('Data', data)
        const state = new ImmutableTree.State<ChartNode>({
            rootNode: new FolderNode({
                id: data.chart_folder,
                name: '.',
                data: data['chart_explorer'],
            }),
            expandedNodes: ['.'],
        })
        const view = new ImmutableTree.View({
            state,
            headerView: (_, node: ChartNode) =>
                headerView(node, this.selectedFile$),
        })

        this.children = [
            {
                class: 'w-25',
                children: [view],
            },
            {
                class: 'w-75 h-100',
                children: [
                    child$(
                        this.selectedFile$.pipe(
                            mergeMap((fileNode: FileNode) => {
                                return new pyYw.PyYouwolClient().admin.system.getFileContent$(
                                    fileNode.id,
                                )
                            }),
                        ),
                        (content: string) => {
                            return {
                                class: 'flex-grow-1 w-100 h-100 py-1',
                                style: { 'font-size': 'small' },
                                connectedCallback: (elem) => {
                                    const config = {
                                        value: content,
                                        mode: 'yaml',
                                        theme: 'blackboard',
                                        lineNumbers: true,
                                    }
                                    const cm = window['CodeMirror'](
                                        elem,
                                        config,
                                    )
                                    cm.setSize('100%', '100%')
                                },
                            }
                        },
                    ),
                ],
            },
        ]
    }
}

function headerView(node: ChartNode, selectedFile$: Subject<FileNode>) {
    if (node instanceof FileNode) {
        return helmFileView(node, selectedFile$)
    }
    return helmFolderView(node)
}

function helmFolderView(node: FileNode) {
    return {
        class: 'd-flex align-items-center',
        children: [
            {
                class: 'fas fa-folder px-2',
            },
            {
                innerText: node.name,
            },
        ],
    }
}
function helmFileView(node: FileNode, selectedFile$: Subject<FileNode>) {
    return {
        class: 'fv-hover-bg-background-alt fv-pointer d-flex align-items-center ',
        onclick: () => selectedFile$.next(node),
        children: [
            {
                class: 'fas fa-file px-2',
            },
            {
                innerText: node.name,
            },
        ],
    }
}
