import shutil
from pathlib import Path

from youwol.pipelines.pipeline_typescript_weback_npm import Template, PackageType, Dependencies, \
    RunTimeDeps, generate_template, DevServer, Bundles, MainModule
from youwol.utils import parse_json

folder_path = Path(__file__).parent

pkg_json = parse_json(folder_path / 'package.json')

webpm_dependencies = {
    'rxjs': '^7.5.6',
    '@youwol/http-clients': '^3.0.0',
    '@youwol/http-primitives': '^0.2.0',
    '@youwol/local-youwol-client': '^0.2.0',
    #
    '@youwol/webpm-client': '^3.0.0',
    '@youwol/rx-vdom': '^1.0.1',
    '@youwol/rx-group-views': '^0.3.0',
    '@youwol/rx-input-views': '^0.3.0',
    '@youwol/rx-button-views': '^0.2.0',
    '@youwol/rx-tree-views': '^0.3.0',
    '@youwol/rx-tab-views': '^0.3.0',
    '@youwol/os-top-banner': '^0.2.0',
    '@youwol/os-widgets': '^0.2.2',
    'd3': '^7.7.0',
    'codemirror': '^5.52.0',
    '@youwol/rx-code-mirror-editors': '^0.4.1',
    '@youwol/grapes-coding-playgrounds': '^0.2.0'
}

template = Template(
    path=folder_path,
    type=PackageType.Application,
    name=pkg_json['name'],
    version=pkg_json['version'],
    shortDescription=pkg_json['description'],
    author=pkg_json['author'],
    dependencies=Dependencies(
        runTime=RunTimeDeps(
            externals=webpm_dependencies,
            includedInBundle={
                "d3-dag": "0.8.2"
            }
        ),
        devTime={
            "lz-string": "^1.4.4",
            #  this is used only for type declarations (from @youwol/grapes-coding-playgrounds)
            "grapesjs": "0.20.4",
        }
    ),
    userGuide=True,
    devServer=DevServer(
        port=3000
    ),
    bundles=Bundles(
        mainModule=MainModule(
            entryFile='./app/index.html',
            loadDependencies=list(webpm_dependencies.keys())
        )
    )
)

generate_template(template)

shutil.copyfile(
    src=folder_path / '.template' / 'src' / 'auto-generated.ts',
    dst=folder_path / 'src' / 'auto-generated.ts'
)

for file in ['README.md', '.gitignore', '.npmignore', '.prettierignore', 'LICENSE', 'package.json',
             'tsconfig.json', 'webpack.config.ts']:
    shutil.copyfile(
        src=folder_path / '.template' / file,
        dst=folder_path / file
    )
