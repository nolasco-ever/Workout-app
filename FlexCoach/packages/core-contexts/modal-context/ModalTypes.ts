import React, { ReactNode } from 'react'

export interface ModalContextValue {
    modalVisible: boolean;
    setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
    openModal: (component: ReactNode) => void;
    modalChildren: ReactNode;
}