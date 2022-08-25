import { install } from '@youwol/cdn-client'

export {}
require('./style.css')

await install(
    {
        modules: [
            { name: '@youwol/fv-group', version: '0.x' },
            { name: '@youwol/fv-input', version: '0.x' },
            { name: '@youwol/fv-button', version: '0.x' },
            { name: '@youwol/fv-tree', version: '0.x' },
            { name: '@youwol/fv-tabs', version: '0.x' },
            { name: '@youwol/os-top-banner', version: '0.x' },
            { name: '@youwol/installers-youwol', version: '0.x' },
            { name: 'd3', version: '5.x' },
        ],
        scripts: [
            'codemirror#5.52.0~codemirror.min.js',
            'codemirror#5.52.0~mode/python.min.js',
        ],
        css: [
            'bootstrap#4.4.1~bootstrap.min.css',
            'fontawesome#5.12.1~css/all.min.css',
            '@youwol/fv-widgets#latest~dist/assets/styles/style.youwol.css',
            'codemirror#5.52.0~codemirror.min.css',
            'codemirror#5.52.0~theme/blackboard.min.css',
        ],
    },
    {
        displayLoadingScreen: true,
    },
)
await import('./on-load')
