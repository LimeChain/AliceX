import { NavigationActions } from 'react-navigation';
import {Navigation} from "../../AliceSDK/Navigation";

let _container;

function setContainer(container) {
  _container = container;
}

export const resetWithStackAction = (index, routes) => _container.dispatch(NavigationActions.reset({
  index,
  actions: routes.map((routeName) => NavigationActions.navigate({ routeName }))
}));

export const resetAction = (index, routeName) => {

  return _container.dispatch(NavigationActions.reset({
    index,
    actions: [
      NavigationActions.navigate({ routeName }),
    ],
  }));
};

export const navigate = (routeName, params, subRouteAction) => {

  return _container.dispatch(NavigationActions.navigate({

    routeName,

    params,

    action: subRouteAction,
  }));
};

export const backAction = key => _container.dispatch(NavigationActions.back({
  key,
}));

export const goBack = () => {
  if (_container.state.nav.routes[_container.state.nav.index].index === 0) {
    Navigation.goHome();
  } else {
    _container.dispatch(NavigationActions.back());
  }
};

export const setParamsAction = (screen, params) => _container.dispatch(NavigationActions.setParams({
  params,
  key: screen,
}));

export default {
  resetAction,
  resetWithStackAction,
  navigate,
  backAction,
  setParamsAction,
  setContainer,
};
