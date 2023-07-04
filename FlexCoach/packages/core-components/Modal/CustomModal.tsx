import { Modal, SafeAreaView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native'
import React from 'react'
import { useModalContext } from '../../core-contexts/modal-context'
import { Button } from '../../../components/buttons/button';
import { colors } from '../../../colors';
import { ListItem } from '../../../components/list-items/ListItem';

export const CustomModal = () => {
    const appColors = colors();
    const { modalVisible, setModalVisible, modalChildren } = useModalContext();

    return (
        <Modal
            animationType='slide'
            visible={modalVisible}
            transparent
        >
            <TouchableWithoutFeedback 
                onPress={() => setModalVisible(false)}
                style={{height: '100%'}}
            >
                <SafeAreaView style={styles.container}>
                    {modalChildren}
                </SafeAreaView>
            </TouchableWithoutFeedback>
        </Modal>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-end',
        marginLeft: 10,
        marginRight: 10
    },
})