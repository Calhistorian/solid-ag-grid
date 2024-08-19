import { BeanCollection } from "ag-grid-community";
import { createContext } from "solid-js";

export const BeansContext = createContext<BeanCollection>({} as BeanCollection);
