import { VirtualDOM } from '@youwol/flux-view'
import { ImmutableTree } from '@youwol/fv-tree'
import { of } from 'rxjs'

export class LogDataNode extends ImmutableTree.Node {
    name: string
    data: unknown

    constructor({ name, data }: { name: string; data: unknown }) {
        super({
            id: `${Math.floor(Math.random() * 1e6)}`,
            children: LogDataNode.getChildren(data),
        })
        this.name = name
        this.data = data
    }

    static getChildren(data) {
        const isObject =
            data != null &&

            typeof data != 'string' &&
            typeof data != 'number' &&
            typeof data != 'boolean'
        return isObject
            ? of(
                  Object.entries(data).map(
                      ([k, v]) => new LogDataNode({ name: k, data: v }),
                  ),
              )
            : undefined
    }
}

export class DataView implements VirtualDOM {
    public readonly class = 'fv-pointer'
    public readonly children: VirtualDOM[]
    public readonly style = {
        fontSize: 'small',
    }

    constructor(data) {
        const rootNode = new LogDataNode({ name: 'data', data })
        const treeState = new ImmutableTree.State({ rootNode })
        const headerView = (
            state: ImmutableTree.State<LogDataNode>,
            node: LogDataNode,
        ) => {
            const title = { innerText: node.name }
            return node.children
                ? title
                : {
                      class: 'd-flex align-items-baseline',
                      children: [
                          title,
                          { tag: 'i', class: 'px-2', innerText: node.data },
                      ],
                  }
        }
        this.children = [
            new ImmutableTree.View({ state: treeState, headerView }),
        ]
    }
}
