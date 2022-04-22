import { child$, VirtualDOM } from '@youwol/flux-view'
import { Select } from '@youwol/fv-input'

import { PyYouwol as pyYw } from '@youwol/http-clients'

import { FilesBrowserView } from '../../common/files-browser.view'

export class ArtifactItem extends Select.ItemData {
    constructor(public readonly artifact: pyYw.Artifact) {
        super(artifact.id, artifact.id)
    }
}

export class ArtifactsView implements VirtualDOM {
    public readonly class = 'pl-3'
    public readonly children: VirtualDOM[]

    constructor(artifacts: pyYw.Artifact[]) {
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
                    } as any),
                ],
            },
            child$(
                select.selection$,
                (item: ArtifactItem) => new ArtifactView(item.artifact),
            ),
        ]
    }
}

class ArtifactView implements VirtualDOM {
    public readonly class = ''
    public readonly children: VirtualDOM[]

    constructor(artifact: pyYw.Artifact) {
        this.children = [
            this.linksView(artifact.links),
            new FilesBrowserView({
                startingFolder: artifact.path,
                originFolderIndex: artifact.path.split('/').length - 1,
            }),
        ]
    }

    linksView(links: pyYw.Link[]) {
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
