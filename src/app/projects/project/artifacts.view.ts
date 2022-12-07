import { child$, VirtualDOM } from '@youwol/flux-view'
import { Select } from '@youwol/fv-input'
import * as pyYw from '@youwol/local-youwol-client'

import { FilesBrowserView } from '../../common'

export class ArtifactItem extends Select.ItemData {
    constructor(public readonly artifact: pyYw.Routers.Projects.Artifact) {
        super(artifact.id, artifact.id)
    }
}

/**
 * @category View
 */
export class ArtifactsView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'pl-3'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(artifacts: pyYw.Routers.Projects.Artifact[]) {
        if (artifacts.length == 0) {
            this.children = [
                {
                    innerText: 'No artifacts available',
                },
            ]
            return
        }
        const select = new Select.State(
            artifacts.map((a) => new ArtifactItem(a)),
            artifacts[0].id,
        )

        this.children = [
            {
                class: 'd-flex align-items-center',
                children: [
                    {
                        innerText: 'Artifacts:',
                    },
                    new Select.View({
                        state: select,
                        class: 'mx-2 px-1',
                    } as {state : Select.State}),
                ],
            },
            child$(
                select.selection$,
                (item: ArtifactItem) => new ArtifactView(item.artifact),
            ),
        ]
    }
}

/**
 * @category View
 */
class ArtifactView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = ''

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(artifact: pyYw.Routers.Projects.Artifact) {
        this.children = [
            this.linksView(artifact.links),
            new FilesBrowserView({
                startingFolder: artifact.path,
                originFolderIndex: artifact.path.split('/').length - 1,
            }),
        ]
    }

    linksView(links: pyYw.Routers.Projects.Link[]) {
        return {
            class: 'd-flex align-items-center',
            children: links.map((link) => {
                return {
                    class: 'my-3 p-2 border rounded',
                    style: {
                        width: 'fit-content',
                    },
                    children: [
                        {
                            target: '_blank',
                            tag: 'a',
                            href: `/admin/system/file/${link.url}`,
                            innerText: link.name,
                        },
                    ],
                }
            }),
        }
    }
}
