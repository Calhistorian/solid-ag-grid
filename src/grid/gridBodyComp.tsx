import {
  _setAriaColCount,
  _setAriaRowCount,
  FakeHScrollComp,
  FakeVScrollComp,
  GridBodyCtrl,
  IGridBodyComp,
  OverlayWrapperComponent,
  RowContainerName,
} from "ag-grid-community";
import {
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  useContext,
} from "solid-js";
import { BeansContext } from "./core/beansContext";
import { classesList } from "./core/utils";
import GridHeaderComp from "./header/gridHeaderComp";
import RowContainerComp from "./rows/rowContainerComp";

const GridBodyComp = () => {
  const { context, resizeObserverService, userComponentRegistry } =
    useContext(BeansContext);

  const [getRowAnimationClass, setRowAnimationClass] = createSignal<string>("");
  const [getAriaColCount, setAriaColCount] = createSignal<number>(0);
  const [getAriaRowCount, setAriaRowCount] = createSignal<number>(0);
  const [getTopHeight, setTopHeight] = createSignal<number>(0);
  const [getBottomHeight, setBottomHeight] = createSignal<number>(0);
  const [getStickyTopHeight, setStickyTopHeight] = createSignal<string>("0px");
  const [getStickyTopTop, setStickyTopTop] = createSignal<string>("0px");
  const [getStickyTopWidth, setStickyTopWidth] = createSignal<string>("100%");
  const [getStickyBottomHeight, setStickyBottomHeight] =
    createSignal<string>("0px");
  const [getStickyBottomBottom, setStickyBottomBottom] =
    createSignal<string>("0px");
  const [getStickyBottomWidth, setStickyBottomWidth] =
    createSignal<string>("100%");
  const [getTopDisplay, setTopDisplay] = createSignal<string>("");
  const [getBottomDisplay, setBottomDisplay] = createSignal<string>("");
  const [getBodyViewportWidth, setBodyViewportWidth] = createSignal<string>("");

  const [getMovingCss, setMovingCss] = createSignal<string | null>(null);
  const [getForceVerticalScrollClass, setForceVerticalScrollClass] =
    createSignal<string | null>(null);
  const [getTopAndBottomOverflowY, setTopAndBottomOverflowY] = createSignal<
    "scroll" | "hidden" | null
  >(null);
  const [getCellSelectableCss, setCellSelectableCss] = createSignal<
    string | null
  >(null);

  // we initialise layoutClass to 'ag-layout-normal', because if we don't, the comp will initially
  // render with no width (as ag-layout-normal sets width to 0, which is needed for flex) which
  // gives the grid a massive width, which then renders a massive amount of columns. this problem
  // is due to React been async, for the non-async version (ie when not using React) this is not a
  // problem as the UI will finish initialising before we set data.
  const [getLayoutClass, setLayoutClass] =
    createSignal<string>("ag-layout-normal");

  let eRoot: HTMLDivElement;
  let eTop: HTMLDivElement;
  let eStickyTop: HTMLDivElement;
  let eBody: HTMLDivElement;
  let eBodyViewport: HTMLDivElement;
  let eBottom: HTMLDivElement;
  let eStickyBottom: HTMLDivElement;

  const destroyFuncs: (() => void)[] = [];
  onCleanup(() => {
    destroyFuncs.forEach((f) => f());
    destroyFuncs.length = 0;
  });

  // onMount(() => {
  //   if (!context) {
  //     return;
  //   }

  //   const newComp = (tag: string) => {
  //     const CompClass = agStackComponentsRegistry.getComponentClass(tag);
  //     const comp = context.createBean(new CompClass());
  //     onCleanup(() => context.destroyBean(comp));
  //     return comp;
  //   };

  //   eRoot.appendChild(newComp("AG-FAKE-HORIZONTAL-SCROLL").getGui());
  //   eRoot.appendChild(newComp("AG-OVERLAY-WRAPPER").getGui());
  //   eBody.appendChild(newComp("AG-FAKE-VERTICAL-SCROLL").getGui());

  //   const compProxy: IGridBodyComp = {
  //     setRowAnimationCssOnBodyViewport: setRowAnimationClass,
  //     setColumnCount: setAriaColCount,
  //     setRowCount: setAriaRowCount,
  //     setTopHeight,
  //     setBottomHeight,
  //     setStickyTopHeight,
  //     setStickyTopTop,
  //     setStickyTopWidth,
  //     setTopDisplay,
  //     setBottomDisplay,
  //     setStickyBottomHeight,
  //     setStickyBottomBottom,
  //     setStickyBottomWidth,
  //     setColumnMovingCss: setMovingCss,
  //     updateLayoutClasses: setLayoutClass,
  //     setAlwaysVerticalScrollClass: setForceVerticalScrollClass,
  //     setPinnedTopBottomOverflowY: setTopAndBottomOverflowY,
  //     setCellSelectableCss: (cssClass: string | null, flag: boolean) =>
  //       setCellSelectableCss(flag ? cssClass : null),
  //     setBodyViewportWidth: setBodyViewportWidth,

  //     registerBodyViewportResizeListener: (listener: () => void) => {
  //       const unsubscribeFromResize = resizeObserverService.observeResize(
  //         eBodyViewport!,
  //         listener
  //       );
  //       destroyFuncs.push(() => unsubscribeFromResize());
  //     },
  //   };
  onMount(() => {
    if (!context) {
      console.error("Context is not available");
      return;
    }

    const destroyFuncs: (() => void)[] = [];
    onCleanup(() => {
      destroyFuncs.forEach((f) => f());
      destroyFuncs.length = 0;
    });

    const addComp = (
      eParent: HTMLElement,
      compClass: new () => any,
      comment: string
    ) => {
      const comp = context.createBean(new compClass());
      eParent.appendChild(document.createComment(comment));
      eParent.appendChild(comp.getGui());
      onCleanup(() => {
        context.destroyBean(comp);
        eParent.removeChild(comp.getGui());
      });
    };

    // Add Fake Horizontal Scroll and Overlay Wrapper
    addComp(eRoot!, FakeHScrollComp, "AG Fake Horizontal Scroll");
    addComp(eRoot!, OverlayWrapperComponent, "AG Overlay Wrapper");

    // Add Fake Vertical Scroll in body
    if (eBody) {
      addComp(eBody, FakeVScrollComp, "AG Fake Vertical Scroll");
    }

    const compProxy: IGridBodyComp = {
      setRowAnimationCssOnBodyViewport: setRowAnimationClass,
      setColumnCount: (count: number) => {
        eRoot && _setAriaColCount(eRoot, count);
      },
      setRowCount: (count: number) => {
        eRoot && _setAriaRowCount(eRoot, count);
      },
      setTopHeight,
      setBottomHeight,
      setStickyTopHeight,
      setStickyTopTop,
      setStickyTopWidth,
      setStickyBottomHeight,
      setStickyBottomBottom,
      setStickyBottomWidth,
      setTopDisplay,
      setBottomDisplay,
      setColumnMovingCss: (cssClass: string, flag: boolean) =>
        setMovingCss(flag ? cssClass : null),
      updateLayoutClasses: setLayoutClass,
      setAlwaysVerticalScrollClass: setForceVerticalScrollClass,
      setPinnedTopBottomOverflowY: setTopAndBottomOverflowY,
      setCellSelectableCss: (cssClass: string, flag: boolean) =>
        setCellSelectableCss(flag ? cssClass : null),
      setBodyViewportWidth: (width: string) => {
        eBodyViewport && (eBodyViewport.style.width = width);
      },
      registerBodyViewportResizeListener: (listener: () => void) => {
        if (eBodyViewport) {
          const unsubscribeFromResize = resizeObserverService.observeResize(
            eBodyViewport,
            listener
          );
          destroyFuncs.push(() => unsubscribeFromResize());
        }
      },
    };

    const ctrl = context.createBean(new GridBodyCtrl());
    onCleanup(() => context.destroyBean(ctrl));

    ctrl.setComp(
      compProxy,
      eRoot!,
      eBodyViewport!,
      eTop!,
      eBottom!,
      eStickyTop!,
      eStickyBottom!
    );
  });

  // const ctrl = context.createBean(new GridBodyCtrl());
  // onCleanup(() => context.destroyBean(ctrl));

  // // fixme - should not be in a timeout,
  // // was because we need GridHeaderComp to be created first
  // setTimeout(
  //   () =>
  //     ctrl.setComp(
  //       compProxy,
  //       eRoot,
  //       eBodyViewport,
  //       eTop,
  //       eBottom,
  //       eStickyTop,
  //       eStickyBottom
  //     ),
  //   0
  // );

  const getRootClasses = createMemo(() =>
    classesList("ag-root", "ag-unselectable", getMovingCss(), getLayoutClass())
  );
  const getBodyClasses = createMemo(() =>
    classesList("ag-body", getLayoutClass())
  );
  const getBodyViewportClasses = createMemo(() =>
    classesList(
      "ag-body-viewport",
      getRowAnimationClass(),
      getLayoutClass(),
      getForceVerticalScrollClass(),
      getCellSelectableCss()
    )
  );
  const getTopClasses = createMemo(() =>
    classesList("ag-floating-top", getCellSelectableCss())
  );
  const getStickyTopClasses = createMemo(() =>
    classesList("ag-sticky-top", getCellSelectableCss())
  );

  const getStickyBottomClasses = createMemo(() =>
    classesList("ag-sticky-bottom", getCellSelectableCss())
  );

  const getBottomClasses = createMemo(() =>
    classesList("ag-floating-bottom", getCellSelectableCss())
  );

  const getTopStyle: any = createMemo(() => ({
    height: getTopHeight(),
    "min-height": getTopHeight(),
    display: getTopDisplay(),
    "overflow-y": getTopAndBottomOverflowY(),
  }));

  const getStickyTopStyle = createMemo(() => ({
    height: getStickyTopHeight(),
    top: getStickyTopTop(),
    width: getStickyTopWidth(),
  }));

  const getStickyBottomStyle = createMemo(() => ({
    height: getStickyBottomHeight(),
    bottom: getStickyBottomBottom(),
    width: getStickyBottomWidth(),
  }));

  const getBottomStyle: any = createMemo(() => ({
    height: getBottomHeight(),
    "min-height": getBottomHeight(),
    display: getBottomDisplay(),
    "overflow-y": getTopAndBottomOverflowY(),
  }));

  const getBodyViewportStyle = createMemo(() => ({
    width: getBodyViewportWidth(),
  }));

  return (
    <div
      ref={eRoot!}
      class={getRootClasses()}
      role="treegrid"
      aria-colcount={getAriaColCount()}
      aria-rowcount={getAriaRowCount()}
    >
      <GridHeaderComp />
      <div
        ref={eTop!}
        class={getTopClasses()}
        role="presentation"
        style={getTopStyle()}
      >
        <RowContainerComp name={"topLeft"} />
        <RowContainerComp name={"topCenter"} />
        <RowContainerComp name={"topRight"} />
        <RowContainerComp name={"topFullWidth"} />
      </div>
      <div class={getBodyClasses()} ref={eBody!} role="presentation">
        <div
          ref={eBodyViewport!}
          class={getBodyViewportClasses()}
          role="presentation"
          style={getBodyViewportStyle()}
        >
          <RowContainerComp name={"left"} />
          <RowContainerComp name={"center"} />
          <RowContainerComp name={"right"} />
          <RowContainerComp name={"fullWidth"} />
        </div>
      </div>
      <div
        ref={eStickyTop!}
        class={getStickyTopClasses()}
        role="presentation"
        style={getStickyTopStyle()}
      >
        <RowContainerComp name={"stickyTopLeft"} />
        <RowContainerComp name={"stickyTopCenter"} />
        <RowContainerComp name={"stickyTopRight"} />
        <RowContainerComp name={"stickyTopFullWidth"} />
      </div>
      <div
        ref={eBottom!}
        class={getBottomClasses()}
        role="presentation"
        style={getBottomStyle()}
      >
        <RowContainerComp name={"bottomLeft"} />
        <RowContainerComp name={"bottomCenter"} />
        <RowContainerComp name={"bottomRight"} />
        <RowContainerComp name={"bottomFullWidth"} />
      </div>
      <div
        ref={eStickyBottom!}
        class={getStickyBottomClasses()}
        role="presentation"
        style={getStickyBottomStyle()}
      >
        <RowContainerComp name={"stickyBottomLeft"} />
        <RowContainerComp name={"stickyBottomCenter"} />
        <RowContainerComp name={"stickyBottomRight"} />
        <RowContainerComp name={"stickyBottomFullWidth"} />
      </div>
    </div>
  );
};

export default GridBodyComp;
