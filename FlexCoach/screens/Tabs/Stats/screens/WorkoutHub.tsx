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

export const WorkoutHub = ({navigation, route}: {navigation: any, route: any}) => {
    const { title, icon } = route.params
    const appColors = colors();
    const screenHeight = Dimensions.get('window').height;

    const [started, setStarted] = useState<boolean>(false);

    const [exercises, setExercises] = useState([
        { name: "Deadlifts", completed: false },
        { name: "Squats", completed: false },
        { name: "Bench Press", completed: false },
        { name: "Overhead Press", completed: false },
        { name: "Barbell Rows", completed: false },
        { name: "Pull-ups", completed: false },
        { name: "Dips", completed: false },
        { name: "Barbell Curls", completed: false },
        { name: "Lunges", completed: false },
        { name: "Romanian Deadlifts", completed: false },
      ]);

    const [numCompleted, setNumCompleted] = useState<number>(0);
    const total = exercises.length;

    const [progress, setProgress] = useState(numCompleted);
    const [progressCompleted, setProgressCompleted] = useState<boolean>(false);

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
                        <View key={index} style={{flexDirection: 'row', alignItems: 'center', height: screenHeight/15}}>
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
                                        <TouchableOpacity
                                            onPress={() => {
                                                const newExercises = [...exercises];
                                                newExercises[index].completed = true;
                                                setExercises(newExercises);
                                                setNumCompleted(prev => prev+1)
                                            }}
                                        >
                                            <CustomText>Begin</CustomText>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </View>
                    )
                })}
            </ScrollView>
            <Button
                title={started ? 'Finish' : 'Start'}
                isPrimary
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