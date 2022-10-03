
const runTimeDependencies = {
    "externals": {
        "rxjs": "^6.5.5",
        "@youwol/http-clients": "^2.0.1",
        "@youwol/http-primitives": "^0.1.1",
        "@youwol/local-youwol-client": "^0.1.2",
        "@youwol/cdn-client": "^1.0.2",
        "@youwol/flux-view": "^1.0.3",
        "@youwol/fv-group": "^0.2.1",
        "@youwol/fv-input": "^0.2.1",
        "@youwol/fv-button": "^0.1.1",
        "@youwol/fv-tree": "^0.2.3",
        "@youwol/fv-tabs": "^0.2.1",
        "@youwol/os-top-banner": "^0.1.1",
        "@youwol/installers-youwol": "^0.1.3",
        "d3": "^5.15.0",
        "codemirror": "^5.52.0",
        "@youwol/fv-code-mirror-editors": "^0.2.0"
    },
    "includedInBundle": {
        "d3-dag": "0.8.2"
    }
}
const externals = {
    "rxjs": "window['rxjs_APIv6']",
    "@youwol/http-clients": "window['@youwol/http-clients_APIv2']",
    "@youwol/http-primitives": "window['@youwol/http-primitives_APIv01']",
    "@youwol/local-youwol-client": "window['@youwol/local-youwol-client_APIv01']",
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
    "@youwol/fv-code-mirror-editors": "window['@youwol/fv-code-mirror-editors_APIv02']",
    "rxjs/operators": "window['rxjs_APIv6']['operators']"
}
const exportedSymbols = {
    "rxjs": {
        "apiKey": "6",
        "exportedSymbol": "rxjs"
    },
    "@youwol/http-clients": {
        "apiKey": "2",
        "exportedSymbol": "@youwol/http-clients"
    },
    "@youwol/http-primitives": {
        "apiKey": "01",
        "exportedSymbol": "@youwol/http-primitives"
    },
    "@youwol/local-youwol-client": {
        "apiKey": "01",
        "exportedSymbol": "@youwol/local-youwol-client"
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
        "apiKey": "02",
        "exportedSymbol": "@youwol/fv-code-mirror-editors"
    }
}

// eslint-disable-next-line @typescript-eslint/ban-types -- allow to allow no secondary entries
const mainEntry : Object = {
    "entryFile": "./app/index.html",
    "loadDependencies": [
        "rxjs",
        "@youwol/http-clients",
        "@youwol/cdn-client",
        "@youwol/flux-view",
        "@youwol/fv-group",
        "@youwol/fv-input",
        "@youwol/fv-button",
        "@youwol/fv-tree",
        "@youwol/fv-tabs",
        "@youwol/os-top-banner",
        "@youwol/installers-youwol",
        "d3",
        "codemirror",
        "@youwol/local-youwol-client",
        "@youwol/http-primitives"
    ]
}

// eslint-disable-next-line @typescript-eslint/ban-types -- allow to allow no secondary entries
const secondaryEntries : Object = {}
const entries = {
     '@youwol/developer-portal': './app/index.html',
    ...Object.values(secondaryEntries).reduce( (acc,e) => ({...acc, [`@youwol/developer-portal/${e.name}`]:e.entryFile}), {})
}
export const setup = {
    name:'@youwol/developer-portal',
        assetId:'QHlvdXdvbC9kZXZlbG9wZXItcG9ydGFs',
    version:'0.1.2-wip',
    shortDescription:"",
    developerDocumentation:'https://platform.youwol.com/applications/@youwol/cdn-explorer/latest?package=@youwol/developer-portal',
    npmPackage:'https://www.npmjs.com/package/@youwol/developer-portal',
    sourceGithub:'https://github.com/youwol/developer-portal',
    userGuide:'https://l.youwol.com/doc/@youwol/developer-portal',
    apiVersion:'01',
    runTimeDependencies,
    externals,
    exportedSymbols,
    entries,
    getDependencySymbolExported: (module:string) => {
        return `${exportedSymbols[module].exportedSymbol}_APIv${exportedSymbols[module].apiKey}`
    },

    installMainModule: ({cdnClient, installParameters}:{cdnClient, installParameters?}) => {
        const parameters = installParameters || {}
        const scripts = parameters.scripts || []
        const modules = [
            ...(parameters.modules || []),
            ...mainEntry['loadDependencies'].map( d => `${d}#${runTimeDependencies.externals[d]}`)
        ]
        return cdnClient.install({
            ...parameters,
            modules,
            scripts,
        }).then(() => {
            return window[`@youwol/developer-portal_APIv01`]
        })
    },
    installAuxiliaryModule: ({name, cdnClient, installParameters}:{name: string, cdnClient, installParameters?}) => {
        const entry = secondaryEntries[name]
        const parameters = installParameters || {}
        const scripts = [
            ...(parameters.scripts || []),
            `@youwol/developer-portal#0.1.2-wip~dist/@youwol/developer-portal/${entry.name}.js`
        ]
        const modules = [
            ...(parameters.modules || []),
            ...entry.loadDependencies.map( d => `${d}#${runTimeDependencies.externals[d]}`)
        ]
        if(!entry){
            throw Error(`Can not find the secondary entry '${name}'. Referenced in template.py?`)
        }
        return cdnClient.install({
            ...parameters,
            modules,
            scripts,
        }).then(() => {
            return window[`@youwol/developer-portal/${entry.name}_APIv01`]
        })
    }
}
