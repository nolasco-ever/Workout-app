import { Dimensions, NativeSyntheticEvent, StyleSheet, TargetedEvent, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native'
import React, { useRef, useState } from 'react'
import { colors } from '../../colors';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { generalIcons, tabIcons } from '../icons/icon-library';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { CustomText } from '../text/customText';

interface SearchBarProps {
    value: string;
    onChangeText?: ((text: string) => void) | undefined;
    onFocus?: null | ((event: NativeSyntheticEvent<TargetedEvent>) => void) | undefined;
    onCancel?: () => void;
    onClear: () => void;
}

export const SearchBar = ({
    value,
    onChangeText,
    onFocus,
    onCancel = () => {},
    onClear
    }: SearchBarProps
) => {
    const appColors = colors();
    const screenWidth = Dimensions.get('window').width;

    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);

    const toggleFocus = () => {
        inputRef.current?.blur();
        setIsFocused(!isFocused);
        onCancel();
        onClear();
    };

    return (
        <View style={[styles.container, {height: screenWidth/7}]}>
            <View style={[styles.inputContainer, {backgroundColor: useColorScheme() === 'dark' ? appColors.onBackground : appColors.lightGrey}]}>
                <FontAwesomeIcon
                    icon={tabIcons.explore as IconProp}
                    color={appColors.text}
                    style={styles.icon}
                />
                <TextInput
                    ref={inputRef}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder='Search'
                    clearButtonMode='while-editing'
                    onFocus={(e: any) => {
                        if (onFocus) {
                            onFocus(e)
                        }
                        setIsFocused(true)
                    }}
                    autoCorrect={false}
                    style={[styles.input, {color: appColors.text}]}
                />
            </View>
            {isFocused && <TouchableOpacity onPress={toggleFocus} style={styles.cancelContainer}>
                <Text style={[styles.cancelText, {color: appColors.text}]}>Cancel</Text>
            </TouchableOpacity>}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center'
    },
    inputContainer: {
        flex: 1,
        borderRadius: 10,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'red'
    },
    input: {
        fontSize: 18,
        height: '100%',
        width: '100%',
        flex: 1
    },
    icon: {
        marginRight: 10,
    },
    cancelContainer: {
        marginLeft: 10,
    },
    cancelText: {
        fontSize: 18
    }
})