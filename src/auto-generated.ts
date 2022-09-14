
const runTimeDependencies = {
    "load": {
        "rxjs": "^6.5.5",
        "@youwol/http-clients": "^1.0.2",
        "@youwol/cdn-client": "^1.0.2",
        "@youwol/flux-view": "^1.0.3",
        "@youwol/fv-group": "^0.2.1",
        "@youwol/fv-input": "^0.2.1",
        "@youwol/fv-button": "^0.1.1",
        "@youwol/fv-tree": "^0.2.3",
        "@youwol/fv-tabs": "^0.2.1",
        "@youwol/os-top-banner": "^0.1.1",
        "@youwol/installers-youwol": "^0.1.1",
        "d3": "^5.15.0",
        "codemirror": "^5.52.0",
        "d3-dag": "0.8.2"
    },
    "differed": {
        "@youwol/fv-code-mirror-editors": "^0.1.1"
    },
    "includedInBundle": [
        "d3-dag"
    ]
}
const externals = {
    "rxjs": "window['rxjs_APIv6']",
    "@youwol/http-clients": "window['@youwol/http-clients_APIv1']",
    "@youwol/cdn-client": "window['@youwol/cdn-client_APIv1']",
    "@youwol/flux-view": "window['@youwol/flux-view_APIv1']",
    "@youwol/fv-group": "window['@youwol/fv-group_APIv02']",
    "@youwol/fv-input": "window['@youwol/fv-input_APIv02']",
    "@youwol/fv-button": "window['@youwol/fv-button_APIv01']",
    "@youwol/fv-tree": "window['@youwol/fv-tree_APIv02']",
    "@youwol/fv-tabs": "window['@youwol/fv-tabs_APIv02']",
    "@youwol/os-top-banner": "window['@youwol/os-top-banner_APIv01']",
    "@youwol/installers-youwol": "window['@youwol/installers-youwol_APIv01']",
    "d3": "window['d3_APIv5']",
    "codemirror": "window['CodeMirror_APIv5']",
    "@youwol/fv-code-mirror-editors": "window['@youwol/fv-code-mirror-editors_APIv01']",
    "rxjs/operators": "window['rxjs_APIv6']['operators']"
}
const exportedSymbols = {
    "rxjs": {
        "apiKey": "6",
        "exportedSymbol": "rxjs"
    },
    "@youwol/http-clients": {
        "apiKey": "1",
        "exportedSymbol": "@youwol/http-clients"
    },
    "@youwol/cdn-client": {
        "apiKey": "1",
        "exportedSymbol": "@youwol/cdn-client"
    },
    "@youwol/flux-view": {
        "apiKey": "1",
        "exportedSymbol": "@youwol/flux-view"
    },
    "@youwol/fv-group": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/fv-group"
    },
    "@youwol/fv-input": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/fv-input"
    },
    "@youwol/fv-button": {
        "apiKey": "01",
        "exportedSymbol": "@youwol/fv-button"
    },
    "@youwol/fv-tree": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/fv-tree"
    },
    "@youwol/fv-tabs": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/fv-tabs"
    },
    "@youwol/os-top-banner": {
        "apiKey": "01",
        "exportedSymbol": "@youwol/os-top-banner"
    },
    "@youwol/installers-youwol": {
        "apiKey": "01",
        "exportedSymbol": "@youwol/installers-youwol"
    },
    "d3": {
        "apiKey": "5",
        "exportedSymbol": "d3"
    },
    "codemirror": {
        "apiKey": "5",
        "exportedSymbol": "CodeMirror"
    },
    "@youwol/fv-code-mirror-editors": {
        "apiKey": "01",
        "exportedSymbol": "@youwol/fv-code-mirror-editors"
    }
}
export const setup = {
    name:'@youwol/developer-portal',
        assetId:'QHlvdXdvbC9kZXZlbG9wZXItcG9ydGFs',
    version:'0.1.1-wip',
    shortDescription:"",
    developerDocumentation:'https://platform.youwol.com/applications/@youwol/cdn-explorer/latest?package=@youwol/developer-portal',
    npmPackage:'https://www.npmjs.com/package/@youwol/developer-portal',
    sourceGithub:'https://github.com/youwol/developer-portal',
    userGuide:'https://l.youwol.com/doc/@youwol/developer-portal',
    apiVersion:'01',
    runTimeDependencies,
    externals,
    exportedSymbols,
    getDependencySymbolExported: (module:string) => {
        return `${exportedSymbols[module].exportedSymbol}_APIv${exportedSymbols[module].apiKey}`
    }
}
