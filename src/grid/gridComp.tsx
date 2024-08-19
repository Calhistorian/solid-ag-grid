import {
  BeanCollection,
  Context,
  FocusableContainer,
  FocusService,
  GridCtrl,
  IGridComp,
} from "ag-grid-community";
import { createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { BeansContext } from "./core/beansContext";
import { classesList } from "./core/utils";
import GridBodyComp from "./gridBodyComp";
import TabGuardComp, { TabGuardRef } from "./tabGuardComp";

const GridComp = (props: { context: Context; class?: string }) => {
  const [rtlClass, setRtlClass] = createSignal<string>("");
  const [keyboardFocusClass, setKeyboardFocusClass] = createSignal<string>("");
  const [layoutClass, setLayoutClass] = createSignal<string>("");
  const [cursor, setCursor] = createSignal<string | null>(null);
  const [userSelect, setUserSelect] = createSignal<string | null>(null);
  const [initialised, setInitialised] = createSignal<boolean>(false);

  const { context } = props;
  const beans = context.getBean("beans") as BeanCollection;

  let tabGuardRef: TabGuardRef;
  const setTabGuardRef = (newRef: TabGuardRef) => {
    tabGuardRef = newRef;
    tabGuardRef && tabGuardReady();
  };

  let eGui: HTMLDivElement;
  let eBody: HTMLDivElement;
  let gridCtrl: GridCtrl;

  const onTabKeyDown = () => undefined;

  const destroyFuncs: (() => void)[] = [];
  onCleanup(() => {
    destroyFuncs.forEach((f) => f());
    destroyFuncs.length = 0;
  });

  const tabGuardReady = () => {
    const beansToDestroy: any[] = [];
    const additionalEls: HTMLElement[] = [];

    const {
      watermarkSelector,
      paginationSelector,
      sideBarSelector,
      statusBarSelector,
      gridHeaderDropZonesSelector,
    } = gridCtrl.getOptionalSelectors();

    const addComponentToDom = (componentClass: new () => any) => {
      const comp = context.createBean(new componentClass());
      const el = comp.getGui();
      eGui.insertAdjacentElement("beforeend", el);
      additionalEls.push(el);
      beansToDestroy.push(comp);
      return comp;
    };

    if (gridHeaderDropZonesSelector) {
      const headerDropZonesComp = context.createBean(
        new gridHeaderDropZonesSelector.component()
      );
      const el = headerDropZonesComp.getGui();
      eGui.insertAdjacentElement("afterbegin", el);
      additionalEls.push(el);
      beansToDestroy.push(headerDropZonesComp);
    }

    if (sideBarSelector) {
      const sideBarComp = context.createBean(new sideBarSelector.component());
      const el = sideBarComp.getGui();
      const bottomTabGuard = eBody.querySelector(".ag-tab-guard-bottom");
      if (bottomTabGuard) {
        bottomTabGuard.insertAdjacentElement("beforebegin", el);
        additionalEls.push(el);
      }
      beansToDestroy.push(sideBarComp);
    }

    if (statusBarSelector) {
      addComponentToDom(statusBarSelector.component);
    }

    if (paginationSelector) {
      addComponentToDom(paginationSelector.component);
    }

    if (watermarkSelector) {
      addComponentToDom(watermarkSelector.component);
    }

    destroyFuncs.push(() => {
      context.destroyBeans(beansToDestroy);
      additionalEls.forEach((el) => {
        if (el.parentElement) {
          el.parentElement.removeChild(el);
        }
      });
    });
  };

  onMount(() => {
    gridCtrl = context.createBean(new GridCtrl());
    destroyFuncs.push(() => context.destroyBean(gridCtrl));

    const compProxy: IGridComp = {
      destroyGridUi: () => {}, // do nothing, as framework users destroy grid by removing the comp
      setRtlClass: setRtlClass,
      forceFocusOutOfContainer: (up?: boolean) => {
        tabGuardRef && tabGuardRef.forceFocusOutOfContainer(up);
      },
      updateLayoutClasses: setLayoutClass,
      getFocusableContainers: () => {
        const containers: FocusableContainer[] = [];

        // Query for the root element of the grid body
        const gridBodyCompEl = eGui.querySelector(".ag-root");
        if (gridBodyCompEl) {
          containers.push({ getGui: () => gridBodyCompEl as HTMLElement });
        }

        // Iterate over the focusable containers to check if they are displayed
        containers.forEach((comp) => {
          // if (comp.isDisplayed()) {
          if (comp) {
            containers.push(comp);
          }
        });

        return containers;
      },
      setCursor,
      setUserSelect,
    };

    gridCtrl.setComp(compProxy, eGui, eGui);
    setInitialised(true);
  });

  const cssClasses = createMemo(() =>
    classesList(
      "ag-root-wrapper",
      rtlClass(),
      keyboardFocusClass(),
      layoutClass(),
      props.class
    )
  );
  const bodyCssClasses = createMemo(() =>
    classesList("ag-root-wrapper-body", "ag-focus-managed", layoutClass())
  );

  const topStyle: any = createMemo(() => ({
    userSelect: userSelect != null ? userSelect() : "",
    WebkitUserSelect: userSelect != null ? userSelect() : "",
    cursor: cursor != null ? cursor() : "",
  }));

  return (
    <div ref={eGui!} class={cssClasses()} style={topStyle()}>
      <div class={bodyCssClasses()} ref={eBody!}>
        {initialised() && (
          // we wait for initialised before rending the children, so GridComp has created and registered with it's
          // GridCtrl before we create the child GridBodyComp. Otherwise the GridBodyComp would initialise first,
          // before we have set the the Layout CSS classes, causing the GridBodyComp to render rows to a grid that
          // doesn't have it's height specified, which would result if all the rows getting rendered (and if many rows,
          // hangs the UI)
          <BeansContext.Provider value={beans}>
            <TabGuardComp
              ref={setTabGuardRef}
              eFocusableElement={eGui!}
              onTabKeyDown={onTabKeyDown}
              gridCtrl={gridCtrl!}
              forceFocusOutWhenTabGuardsAreEmpty={true}
            >
              <GridBodyComp />
            </TabGuardComp>
          </BeansContext.Provider>
        )}
      </div>
    </div>
  );
};

export default GridComp;
