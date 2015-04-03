import {CompositionEngine} from '../templating/index';
import {RouteLoader, Router} from '../router/index';
import {relativeToFile} from '../path/index';
import {Origin} from '../metadata/index';

export class TemplatingRouteLoader extends RouteLoader {
  static inject(){ return [CompositionEngine]; }
  constructor(compositionEngine){
    this.compositionEngine = compositionEngine;
  }

  loadRoute(router, config){
    var childContainer = router.container.createChild(),
        instruction = {
          viewModel: relativeToFile(config.moduleId, Origin.get(router.container.viewModel.constructor).moduleId),
          childContainer:childContainer,
          view:config.view || config.viewStrategy
        },
        childRouter;

    childContainer.registerHandler(Router, c => {
      return childRouter || (childRouter = router.createChild(childContainer));
    });

    return this.compositionEngine.createViewModel(instruction).then(instruction => {
      instruction.executionContext = instruction.viewModel;
      instruction.router = router;
      return instruction;
    });
  }
}