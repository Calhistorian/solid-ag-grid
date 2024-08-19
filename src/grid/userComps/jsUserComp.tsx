// import { UserCompDetails } from "ag-grid-community";
// import { onCleanup, useContext } from "solid-js";
// import { BeansContext } from "../core/beansContext";

// const JsUserComp = (p: { compDetails: UserCompDetails; ref?: (ref: any) => void }) => {
//   const { context } = useContext(BeansContext);

//   const promise = p.compDetails.newAgStackInstance();
//   if (!promise) {
//     return <></>;
//   }

//   const comp = promise.resolveNow(null, (x: any) => x); // js comps are never async
//   if (!comp) {
//     return <></>;
//   }
//   p.ref && p.ref(comp);

//   const gui = comp.getGui();

//   onCleanup(() => {
//     comp && context.destroyBean(comp);
//     p.ref && p.ref(undefined);
//   });

//   return <>{gui}</>;
// };

// export default JsUserComp;
import { UserCompDetails } from "ag-grid-community";
import { onCleanup, useContext, createSignal } from "solid-js";
import { BeansContext } from "../core/beansContext";

const JsUserComp = (p: {
  compDetails: UserCompDetails;
  ref?: (ref: any) => void;
}) => {
  const { context } = useContext(BeansContext);

  let destroyed = false;
  const [comp, setComp] = createSignal<any>(null);

  const promise = p.compDetails.newAgStackInstance();
  if (!promise) {
    return <></>;
  }

  promise.then((c) => {
    if (destroyed) {
      context.destroyBean(c);
      return;
    }
    setComp(c);
    p.ref && setRef(p.ref, c);
  });

  onCleanup(() => {
    destroyed = true;
    const compInstance = comp();
    if (compInstance) {
      context.destroyBean(compInstance);
      p.ref && setRef(p.ref, undefined);
    }
  });

  return <>{comp()?.getGui()}</>;
};

const setRef = (ref: ((ref: any) => void) | undefined, value: any) => {
  if (!ref) {
    return;
  }

  if (typeof ref === "function") {
    ref(value);
  }
};

export default JsUserComp;
