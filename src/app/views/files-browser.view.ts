import { children$, VirtualDOM } from "@youwol/flux-view"
import { BehaviorSubject, Observable } from "rxjs"
import { mergeMap } from "rxjs/operators"
import { PyYouwolClient } from "../client/py-youwol.client"


export class FilesBrowserView implements VirtualDOM {

    public readonly class = 'w-100 overflow-auto'
    public readonly style = {}
    public readonly children: VirtualDOM[]
    public readonly startingFolder: string
    public readonly originFolderIndex: number

    public readonly folderSelected$: BehaviorSubject<string>
    public readonly items$: Observable<any>


    constructor(params: {
        startingFolder: string,
        originFolderIndex: number,
        style?
    }) {
        Object.assign(this, params)
        this.folderSelected$ = new BehaviorSubject<string>(this.startingFolder)
        this.items$ = this.folderSelected$.pipe(
            mergeMap((path) => PyYouwolClient.system.folderContent$(path))
        )
        this.children = [
            originLocationView(this.startingFolder, this.originFolderIndex),
            folderNavigationView(this.folderSelected$, this.originFolderIndex),
            {
                class: 'my-4',
                children: children$(
                    this.items$,
                    ({ files, folders }) => {

                        let filesVDom = files.map(name => fileView(name))
                        let foldersVDom = folders.map(name => folderView(this.folderSelected$, name))
                        return [...foldersVDom, ...filesVDom]
                    })
            }
        ]
    }
}

function originLocationView(startingFolder: string, originFolderIndex: number): VirtualDOM {

    if (originFolderIndex == 0) {
        return {}
    }
    return {
        class: 'd-flex',
        children: [
            {
                innerText: 'Origin:'
            },
            {
                class: 'px-2',
                innerText: startingFolder
                    .split('/')
                    .slice(1, originFolderIndex)
                    .reduce((acc, e) => `${acc}/${e}`)
            }
        ]
    }
}

function folderNavigationView(
    folderSelected$: BehaviorSubject<string>,
    originFolderIndex: number
) {
    return {
        class: 'd-flex',
        children: children$(
            folderSelected$,
            (paths: string) => paths.split('/').slice(originFolderIndex).map((element) => pathElementView(folderSelected$, element))
        )
    }
}
function pathElementView(
    folderSelected$: BehaviorSubject<string>,
    element: string
): VirtualDOM {

    let index = folderSelected$.getValue().split('/').indexOf(element)

    return {
        class: 'px-2 fv-pointer fv-hover-bg-background-alt border rounded',
        innerText: element,
        onclick: () => folderSelected$.next(folderSelected$.getValue().split('/').slice(0, index + 1).join('/'))

    }
}


function fileView(name: string): VirtualDOM {

    return {
        class: 'd-flex  align-items-center fv-text-disabled',
        style: { "user-select": 'none' },
        children: [
            { class: 'fas fa-file px-2' },
            { innerText: name }
        ]
    }
}

function folderView(
    folderSelected$: BehaviorSubject<string>,
    name: string
): VirtualDOM {

    return {
        class: 'fv-pointer d-flex align-items-center fv-hover-bg-background-alt',
        style: {
            userSelect: 'none'
        },
        ondblclick: () => folderSelected$.next(`${folderSelected$.getValue()}/${name}`),
        children: [
            {
                class: 'fas fa-folder px-2'
            },
            {
                innerText: name
            }
        ]
    }
}
