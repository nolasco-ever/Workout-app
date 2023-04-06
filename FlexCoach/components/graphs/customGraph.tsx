import { Dimensions, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native'
import React, { useRef, useState } from 'react'
import { colors } from '../../colors';
import { useSpring,animated } from "@react-spring/native";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { generalIcons } from '../icons/icon-library';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { TouchableOpacity } from 'react-native-gesture-handler';

interface CustomGraphProps {
    yAxisData: number[];
    xAxisLabels: string[];
    type: 'bar' | 'line';
}

export const CustomGraph = ({yAxisData, xAxisLabels, type}: CustomGraphProps) => {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const appColors = colors();

    //order y axis data in ascending order, used for seting yAxis range
    let orderedYAxistArr = [...yAxisData].sort((a,b) => { return a===b ? 0 : a<b ? -1 : 1});

    //set the min and max of the y axis
    let yAxisMin: number;
    let yAxisMax: number;

    if (orderedYAxistArr[orderedYAxistArr.length -1] <= 20) {
        yAxisMin = 0;
        yAxisMax = orderedYAxistArr[orderedYAxistArr.length - 1]
    } else {
        yAxisMin = orderedYAxistArr[0]-20 < 0 ? 0 : Math.floor((orderedYAxistArr[0]-20)/10)*10;  //round to the nearest 10
        yAxisMax = Math.ceil((orderedYAxistArr[orderedYAxistArr.length-1]+20)); //round to the nearest 10
    }

    //tells the while loop whether to add or subtract from max or min
    let increaseValue = true;

    //there are ony going to be 5 numbers on the y axis so we need to make sure the range is cleanly divisible by 4
    while((yAxisMax - yAxisMin)%4 !== 0){
        if (yAxisMax <= 20) {
            //round it up to the next highest number divisible by 4
            yAxisMax = Math.ceil(yAxisMax / 4) * 4;
        } else {
            if (increaseValue === true){
                yAxisMax+=10;
                increaseValue = false;
            }
            else if(increaseValue === false){
                yAxisMin-=10;
                increaseValue = true;
            }
        }
    }

    //initialize the range array with the minimum number on the yAxis
    let rangeArr = [yAxisMin];

    //finish the rangeArray that holds all the yAxis numbers
    for (let i = 1; i < 5; i++){
        rangeArr.push(rangeArr[i-1] + Math.ceil((yAxisMax-yAxisMin)/4))
    }

    //animation for dots tgo from 0 to the given height
    const dotStyle = (val: number) => {
        return useSpring({
            height: ((val-yAxisMin)/(yAxisMax-yAxisMin))*100 === 0 ? '3%' : `${((((val-yAxisMin)+((yAxisMax-yAxisMin)*0.00001))/(yAxisMax-yAxisMin))*100)}%`,
    
            from: {
                height: '0%'
            },

            config: {
                mass: 1,
                tension: 150,
                friction: 40
            }
        })
    }

    const [popUpState, setPopUpState] = useState({visible: false, index: 0});
    const scrollViewRef: React.LegacyRef<ScrollView> = useRef(null)

    return (
        <View style={[styles.container, {width: screenWidth, height: screenHeight * 0.3}]}>
            <View style={{flex: 5, flexDirection: 'row', width: '100%'}}>
                <View style={styles.yAxisContainer}>
                    {rangeArr.map((item, index) => (
                        <Text style={[styles.axisText, {color: appColors.subtext}]} key={index}>{item}</Text>
                    ))}
                </View>
                <ScrollView
                    ref={scrollViewRef}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({animated: true})}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.barsContainer}
                >
                    {yAxisData.map((item, index) => (
                        <TouchableOpacity key={index} onPress={() => setPopUpState(prevState => ({...prevState, visible: prevState.index === index ? !prevState.visible : true, index: index}))} style={[styles.barAndTitleContainer, {width: screenWidth/5}]}>
                            <animated.View
                                style={[
                                    styles.bar,
                                    dotStyle(item),
                                    {
                                        backgroundColor: type === 'bar' ? appColors.primary : appColors.transparent
                                    }
                                ]}
                            >
                                {type === 'line' && <FontAwesomeIcon icon={generalIcons.bulletPoint as IconProp} color={appColors.text} size={10} style={{alignSelf: 'center'}}/>}
                                {popUpState.visible && popUpState.index === index &&
                                    <View style={{width: 50, bottom: 50, backgroundColor: appColors.secondary, padding: 10, borderRadius: 5, alignItems: 'center'}}>
                                        <Text style={{color: appColors.onPrimaryText, fontWeight: 'bold'}}>{item}</Text>
                                    </View>
                                }
                            </animated.View>
                            <Text style={[styles.axisText, {color: appColors.subtext}]}>{xAxisLabels[index]}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>            
            </View>
        </View>
      )
}

const styles = StyleSheet.create({
    container: {
        padding: 10,
        flexDirection: 'column',
        justifyContent: 'flex-end',
    },
    barsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    barAndTitleContainer: {
        flexDirection: 'column', 
        alignItems: 'center',
        height: '90%',
        justifyContent: 'flex-end',
    },
    bar: {
        width: '50%',
        borderRadius: 5,
        bottom: 0,
    },
    yAxisContainer: {
        flexDirection: 'column-reverse', 
        justifyContent: 'space-between', 
        height: '95%',
        alignItems: 'center',
    },
    axisText: {
        fontWeight: 'bold',
        fontSize: 16
    }
})