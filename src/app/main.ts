import { install } from '@youwol/cdn-client'

export {}
require('./style.css')

await install(
    {
        modules: [
            '@youwol/fv-group#0.x',
            '@youwol/fv-input#0.x',
            '@youwol/fv-button#0.x',
            '@youwol/fv-tree#0.x',
            '@youwol/fv-tabs#0.x',
            '@youwol/os-top-banner#0.x',
            '@youwol/installers-youwol#0.x',
            'd3#5.x'
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
        displayLoadingScreen: true,
    }
)
await import('./on-load')
