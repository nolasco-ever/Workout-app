import { createContext } from "react";
import { ModalContextValue } from "./ModalTypes";

export const initialModalState = false;
export const initialModalChildren = null;

export const ModalContext = createContext<ModalContextValue>({
    modalVisible: initialModalState, 
    setModalVisible: () => null, 
    openModal: () => null,
    modalChildren: initialModalChildren
});