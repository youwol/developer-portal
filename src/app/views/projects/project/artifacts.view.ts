import { child$, VirtualDOM } from "@youwol/flux-view";
import { Select } from "@youwol/fv-input";
import { ArtifactResponse, Link } from "src/app/client/models";
import { FilesBrowserView } from "../../files-browser.view";


export class ArtifactItem extends Select.ItemData {

    constructor(public readonly artifact: ArtifactResponse) {
        super(artifact.id, artifact.id)
    }
}

export class ArtifactsView implements VirtualDOM {

    public readonly class = "border-top py-4 "
    public readonly children: VirtualDOM[]

    constructor(artifacts: ArtifactResponse[]) {

        if (artifacts.length == 0) {
            this.children = [
                {
                    tag: 'h3',
                    innerText: 'No artifacts available'
                }
            ]
            return
        }
        let select = new Select.State(
            artifacts.map(a => new ArtifactItem(a)),
            artifacts[0].id
        )

        this.children = [
            {
                tag: 'h3',
                innerText: 'Artifacts'
            },
            {
                class: "pl-3",
                children: [
                    {
                        class: "d-flex align-items-center mb-3",
                        children: [
                            {
                                innerText: 'pick artifact:'
                            },
                            new Select.View({ state: select, class: 'mx-2 px-1' } as any)
                        ]
                    },
                    child$(
                        select.selection$,
                        (item: ArtifactItem) => new ArtifactView(item.artifact)
                    )
                ]
            }
        ]
    }
}


class ArtifactView implements VirtualDOM {

    public readonly class = ""
    public readonly children: VirtualDOM[]

    constructor(artifact: ArtifactResponse) {
        this.children = [
            this.linksView(artifact.links),
            new FilesBrowserView({
                startingFolder: artifact.path,
                originFolderIndex: artifact.path.split('/').length - 1
            })
        ]
    }

    linksView(links: Link[]) {

        return {
            class: 'd-flex align-items-center',
            children: links.map((link) => {

                return {
                    class: 'my-3 p-2 border rounded',
                    style: {
                        width: 'fit-content'
                    },
                    children: [{
                        target: "_blank",
                        tag: 'a',
                        href: `/admin/system/file/${link.url}`,
                        innerText: link.name
                    }]
                }
            })
        }
    }
}