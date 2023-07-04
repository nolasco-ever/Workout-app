import React, { ReactNode, useMemo, useState } from "react";
import { ModalContext, initialModalChildren, initialModalState } from "./ModalContext";

interface ModalProviderProps {
    children: ReactNode;
}

export const ModalProvider = ({children}: ModalProviderProps) => {
    const [modalVisible, setModalVisible] = useState<boolean>(initialModalState);
    const [modalChildren, setModalChildren] = useState<ReactNode>(initialModalChildren);

    const openModal = (component: ReactNode) => {
        setModalVisible(true);
        setModalChildren(component);
    }

    const value = useMemo(() => {
        return {
            modalVisible: modalVisible,
            setModalVisible: setModalVisible,
            openModal: openModal,
            modalChildren: modalChildren
        }
    }, [modalVisible])

    return (
        <ModalContext.Provider value={value}>
            {children}
        </ModalContext.Provider>
    )
}