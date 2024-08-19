import { GridHeaderCtrl, IGridHeaderComp } from "ag-grid-community";
import {
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  useContext,
} from "solid-js";
import { BeansContext } from "../core/beansContext";
import { CssClasses } from "../core/utils";
import HeaderRowContainerComp from "./headerRowContainerComp";

const GridHeaderComp = () => {
  const [getCssClasses, setCssClasses] = createSignal<CssClasses>(
    new CssClasses()
  );
  const [getHeight, setHeight] = createSignal<string>();

  const { context } = useContext(BeansContext);
  let eGui: HTMLDivElement;

  const destroyFuncs: (() => void)[] = [];
  onCleanup(() => {
    destroyFuncs.forEach((f) => f());
    destroyFuncs.length = 0;
  });

  onMount(() => {
    if (!context) {
      console.warn("Context is not available");
      return;
    }

    const compProxy: IGridHeaderComp = {
      addOrRemoveCssClass: (name, on) =>
        setCssClasses(getCssClasses().setClass(name, on)),
      setHeightAndMinHeight: (height) => setHeight(height),
    };

    const gridHeaderCtrl = new GridHeaderCtrl();
    if (!gridHeaderCtrl) {
      console.error("GridHeaderCtrl is not available");
      return;
    }

    const ctrl = context.createBean(gridHeaderCtrl);
    ctrl.setComp(compProxy, eGui, eGui);

    destroyFuncs.push(() => context.destroyBean(ctrl));
  });

  const className = createMemo(() => {
    let res = getCssClasses().toString();
    return "ag-header " + res;
  });

  const style = createMemo(() => ({
    height: getHeight(),
    "min-height": getHeight(),
  }));

  return (
    <div ref={eGui!} class={className()} style={style()} role="presentation">
      <HeaderRowContainerComp pinned={"left"} />
      <HeaderRowContainerComp pinned={null} />
      <HeaderRowContainerComp pinned={"right"} />
    </div>
  );
};

export default GridHeaderComp;
