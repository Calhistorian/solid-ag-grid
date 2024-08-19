import {
  _getRowContainerOptions,
  IRowContainerComp,
  RowContainerCtrl,
  RowContainerName,
  RowCtrl,
} from "ag-grid-community";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  useContext,
} from "solid-js";
import { BeansContext } from "../core/beansContext";
import { classesList } from "../core/utils";
import RowComp from "./rowComp";

const RowContainerComp = (props: { name: RowContainerName }) => {
  const { context } = useContext(BeansContext);

  const [viewportHeight, setViewportHeight] = createSignal<string>("");
  const [rowCtrlsOrdered, setRowCtrlsOrdered] = createSignal<RowCtrl[]>([]);
  const [rowCtrls, setRowCtrls] = createSignal<RowCtrl[]>([]);
  const [domOrder, setDomOrder] = createSignal<boolean>(false);

  const { name } = props;
  const containerOptions = createMemo(() => _getRowContainerOptions(name));

  let eViewport: HTMLDivElement;
  let eContainer: HTMLDivElement;

  // const cssClasses = createMemo(() =>
  //   RowContainerCtrl.getRowContainerCssClasses(name)
  // );
  // const viewportClasses = createMemo(() => classesList(cssClasses().viewport));
  // const containerClasses = createMemo(() =>
  //   classesList(cssClasses().container)
  // );

  // no need to useMemo for boolean types
  const centerTemplate =
    name === "center" ||
    name === "topCenter" ||
    name === "bottomCenter" ||
    name === "stickyTopCenter";

  // if domOrder=true, then we just copy rowCtrls into rowCtrlsOrdered observing order,
  // however if false, then we need to keep the order as they are in the dom, otherwise rowAnimation breaks
  let rowCtrlsOrderedCopy: RowCtrl[] = [];
  createEffect(() => {
    if (domOrder()) {
      setRowCtrlsOrdered(rowCtrls());
      return;
    }
    // if dom order not important, we don't want to change the order
    // of the elements in the dom, as this would break transition styles
    //
    // we use the rowCtrlsOrderedCopy, to avoid this effect depending on and
    // setting the same value, hence causing an infinite loop
    const prev = rowCtrlsOrderedCopy;
    const oldRows = prev.filter((r) => rowCtrls().indexOf(r) >= 0);
    const newRows = rowCtrls().filter((r) => oldRows.indexOf(r) < 0);
    const next = [...oldRows, ...newRows];
    setRowCtrlsOrdered(next);
    rowCtrlsOrderedCopy = next;
  });

  createEffect(() => {
    const compProxy: IRowContainerComp = {
      setHorizontalScroll: (horizontalScroll) => {
        if (eContainer) {
          eContainer.style.overflowX = horizontalScroll ? "auto" : "hidden";
        }
      },
      setViewportHeight: setViewportHeight,
      setRowCtrls: ({ rowCtrls }) => setRowCtrls(rowCtrls),
      setDomOrder: (domOrder) => setDomOrder(domOrder),
      setContainerWidth: (width) => {
        if (eContainer) {
          eContainer.style.width = width;
        }
      },
      setOffsetTop: (offsetTop) => {
        if (eContainer) {
          eContainer.style.top = offsetTop;
        }
      },
    };

    const ctrl = context.createBean(new RowContainerCtrl(name));
    onCleanup(() => context.destroyBean(ctrl));

    ctrl.setComp(compProxy, eContainer, eViewport);
  });

  const viewportStyle = createMemo(() => ({
    height: viewportHeight(),
  }));

  const buildContainer = () => (
    <div ref={eContainer} role={"rowgroup"}>
      <For each={rowCtrlsOrdered()}>
        {(rowCtrl, i) => (
          <RowComp
            rowCtrl={rowCtrl}
            containerType={containerOptions().type}
          ></RowComp>
        )}
      </For>
    </div>
  );

  return (
    <>
      {centerTemplate ? (
        <div ref={eViewport!} role="presentation" style={viewportStyle()}>
          {buildContainer()}
        </div>
      ) : (
        buildContainer()
      )}
    </>
  );
};

export default RowContainerComp;
