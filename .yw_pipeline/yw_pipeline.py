from youwol.environment.forward_declaration import YouwolEnvironment
from youwol.environment.models import IPipelineFactory
from youwol.environment.models_project import BrowserApp, Execution, BrowserAppGraphics, Link
from youwol.pipelines.pipeline_typescript_weback_npm import pipeline, PipelineConfig
from youwol_utils.context import Context


class PipelineFactory(IPipelineFactory):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    async def get(self, _env: YouwolEnvironment, context: Context):
        config = PipelineConfig(target=BrowserApp(
            displayName="Dev. portal",
            execution=Execution(
                standalone=True
            ),
            links=[
                Link(name="doc", url="dist/docs/index.html"),
                Link(name="coverage", url="coverage/lcov-report/index.html"),
                Link(name="bundle-analysis", url="dist/bundle-analysis.html")
            ],
            graphics=BrowserAppGraphics(
                appIcon={'class': 'fas fa-code fa-2x'},
                fileIcon={},
                background={
                    "style": {
                        "width": '100%',
                        "height": '100%',
                        "opacity": 0.3,
                        "z-index": -1,
                    }
                }
            ),
        ))
        return await pipeline(config, context)
