import { Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { colors } from '../../../../colors'
import { ListItem } from '../../../../components/list-items/ListItem'
import { Button } from '../../../../components/buttons/button'
import { AnimatedImage } from '../../../../components/utils/AnimatedImage'
import { progressBarAnimation, successCheckAnimation } from '../../../../animations/shared'
import { ProgressBar } from '../../../../components/progress-indicators/progressBar'
import { CustomText } from '../../../../components/text/customText'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { directionIcons } from '../../../../components/icons/icon-library'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { mockExercises } from '../../../../mocks/trainingDataMocks'
import { useNavigation, NavigationProp } from '@react-navigation/native'
import { HomeStackParams } from '../HomeStack'

export const WorkoutHub = () => {
    const navigation = useNavigation<NavigationProp<HomeStackParams>>();

    const appColors = colors();
    const screenHeight = Dimensions.get('window').height;

    const [started, setStarted] = useState<boolean>(false);

    const [numCompleted, setNumCompleted] = useState<number>(0);
    const total = mockExercises.length;

    const [progress, setProgress] = useState(numCompleted);
    const [progressCompleted, setProgressCompleted] = useState<boolean>(false);

    const [exercises, setExercises] = useState(mockExercises);

    useEffect(() => {
        const progressCompleted = Math.ceil((100 / total) * numCompleted);
        let diff = progressCompleted - progress;
        if (diff > 0) {
            const intervalTime = 1000 / diff;
            let progressInterval: number;
            let currentProgress = progress;
            
            const increaseProgress = () => {
              currentProgress += 1;
              setProgress(currentProgress);
              
              if (currentProgress === progressCompleted) {
                clearInterval(progressInterval);
              }
            }
            
            progressInterval = setInterval(increaseProgress, intervalTime);
        }
    }, [numCompleted]);

    useEffect(() => {
        if (progress === 100) {
            setProgress(prev => prev+1)
        }
    }, [progress])

    useEffect(() => {
        setNumCompleted(exercises.filter(item => item.completed === true).length)
    }, [exercises])

    return (
        <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
            {started ? (
                <View style={{height:  screenHeight/10}}>
                    {!progressCompleted ? (
                        <ProgressBar
                            title='In Progress'
                            percent={progress/100}
                            setProgressCompleted={setProgressCompleted}
                        />
                    ) : (
                        <AnimatedImage
                            source={successCheckAnimation}
                            size={100}
                            loop={false}
                        />
                    )}
                </View>
            ) : (
                <View style={{padding: 10}}>
                    <CustomText type='subheader'>
                        Here are your workouts for today. Tap 'Start' to begin today's training!
                    </CustomText>
                </View>
            )}
            <ScrollView>
                {exercises.map((item, index) => {
                    return (
                        <TouchableOpacity 
                            key={index}
                            style={{flexDirection: 'row', alignItems: 'center', height: screenHeight/15}}
                            onPress={() => {
                                if (started) {
                                    const newExercises = [...exercises];
                                    newExercises[index].completed = true;
                                    setExercises(newExercises);
                                    navigation.navigate('WorkoutLoggerScreen', { exercise: item })
                                }
                            }}
                        >
                            <View style={{flex: 1}}>
                                <ListItem
                                    title={item.name}
                                />
                            </View>
                            {started && (
                                <View style={{margin: 10}}>
                                    {item.completed ? (
                                        <AnimatedImage
                                            source={successCheckAnimation}
                                            size={40}
                                            loop={false}
                                        />
                                    ) : (
                                        <FontAwesomeIcon
                                            icon={directionIcons.angleRight as IconProp}
                                            size={25}
                                            color={appColors.icon}
                                        />
                                    )}
                                </View>
                            )}
                        </TouchableOpacity>
                    )
                })}
            </ScrollView>
            <Button
                label={started ? 'Finish' : 'Start'}
                onPress={() => started ? navigation.goBack() : setStarted(true)}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
})