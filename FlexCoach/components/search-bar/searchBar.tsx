import { 
    Dimensions, 
    NativeSyntheticEvent, 
    StyleSheet, 
    TargetedEvent, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    View, 
    useColorScheme 
} from 'react-native'
import React, { useRef, useState } from 'react'
import { colors } from '../../colors';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { tabIcons } from '../icons/icon-library';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { animated, useSpring } from '@react-spring/native';
import { ResultsList } from './resultsList';

interface SearchBarProps {
    value: string;
    onChangeText?: ((text: string) => void) | undefined;
    onFocus?: null | ((event: NativeSyntheticEvent<TargetedEvent>) => void) | undefined;
    onCancel?: () => void;
    onClear: () => void;
    navigation: any;
}

export const SearchBar = ({
    value,
    onChangeText,
    onFocus,
    onCancel = () => {},
    onClear,
    navigation
    }: SearchBarProps
) => {
    const appColors = colors();
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;

    const [isFocused, setIsFocused] = useState<boolean>(false);
    const [animateCancel, setAnimateCancel] = useState<boolean>(false);
    const inputRef = useRef<TextInput>(null);

    const toggleFocus = () => {
        inputRef.current?.blur();
        setIsFocused(!isFocused);
        onCancel();
        onClear();
    };

    // animations for cancel button container to slide in and out
    const onFocusCancelStyle = () => {
        return useSpring({
            width: screenWidth/6,
            opacity: 1,
            marginLeft: 10,

            from: {
                width: 0,
                opacity: 0,
                marginLeft: 0
            },

            config: {
                mass: 1,
                tension: 150,
                friction: 25
            }
        })
    }

    const onBlurCancelStyle = () => {
        return useSpring({
            width: 0,
            opacity: 0,
            marginLeft: 0,

            from: {
                width: screenWidth/6,
                opacity: 1,
                marginLeft: 10
            },

            config: {
                mass: 1,
                tension: 150,
                friction: 25
            }
        })
    }

    const cancelSpringStyle = isFocused ? onFocusCancelStyle() : onBlurCancelStyle()

    return (
        <>
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
                            setIsFocused(true);

                            if (!animateCancel) {
                                setAnimateCancel(true);
                            }
                        }}
                        autoCorrect={false}
                        style={[styles.input, {color: appColors.text}]}
                    />
                </View>
                <animated.View 
                    style={[
                        styles.cancelContainer, 
                        animateCancel ? cancelSpringStyle : {width: 0, opacity: 0, marginLeft: 0}
                    ]}
                >
                    <TouchableOpacity onPress={toggleFocus} style={styles.cancelTouchable}>
                        <Text
                            style={[
                                styles.cancelText,
                                {
                                    color: appColors.text
                                }
                            ]}
                            numberOfLines={1}
                            ellipsizeMode='clip'
                        >
                            Cancel
                        </Text>
                    </TouchableOpacity>
                </animated.View>
            </View>

            {isFocused ? <ResultsList navigation={navigation}/> : null}
        </>
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
        height: '100%',
        width: '100%',
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
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    cancelTouchable: {
        width: '100%',
        height: '100%',
    },
    cancelText: {
        fontSize: 18,
    }
})