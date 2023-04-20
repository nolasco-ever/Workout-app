import { StyleSheet, Text, TouchableOpacity, Vibration, View, useColorScheme } from 'react-native'
import React, { useState } from 'react'
import { colors } from '../../../../colors'
import { mockTriviaQuestions } from '../../../../mocks/triviaQuestionsMocks';
import { successCheckAnimation } from '../../../../animations/shared';
import LottieView from 'lottie-react-native'

export const TriviaQuestion = () => {
    const appColors = colors();
    const systemTheme = useColorScheme();

    const min = 0;
    const max = mockTriviaQuestions.length - 1;
    // const randomNum = Math.floor(Math.random() * (max - min + 1) + min);
    const randomNum = 4;

    const correctAnswer = mockTriviaQuestions[randomNum].correctAnswer;
    const [isCorrect, setIsCorrect] = useState<boolean | undefined>();
    const [selectedAnswer, setSelectedAnswer] = useState<number | undefined>();

    const handleSelectAnswer = (answer: number) => {
        if (answer === correctAnswer) {
            setIsCorrect(true)
            Vibration.vibrate(100)
        } else {
            setIsCorrect(false)
        }

        setSelectedAnswer(answer)
    }
    
    return (
        <View
            style={[
                styles.container, 
                {
                    backgroundColor: appColors.onBackground,
                    shadowColor: '#000000',
                    shadowOpacity: systemTheme === 'light' ? 0.1 : 0,
                    shadowOffset: {width: 1, height: 1}
                }
            ]}
        >
                <Text style={[styles.title, {color: appColors.text}]}>Question of the Day</Text>
                <Text style={[styles.questionText, {color: appColors.text}]}>{mockTriviaQuestions[randomNum].question}</Text>
                {mockTriviaQuestions[randomNum].possibleAnswers.map(item => (
                    <TouchableOpacity
                        key={item.id} 
                        style={[
                            styles.optionContainer, 
                            {
                                borderColor: selectedAnswer === item.id ? isCorrect ? appColors.onSuccess : appColors.onError : appColors.inactive,
                                backgroundColor: selectedAnswer === item.id ? isCorrect ? appColors.onSuccess : appColors.onError : appColors.transparent
                            }
                        ]}
                        onPress={() => handleSelectAnswer(item.id)}
                    >
                        <Text style={[styles.answerText, {color: selectedAnswer === item.id ? appColors.onBackground : appColors.text}]}>{item.answer}</Text>
                        {selectedAnswer === item.id && isCorrect ? (
                            <LottieView
                                source={successCheckAnimation}
                                autoPlay={true}
                                loop={false}
                                style={{height: '100%', width: '10%', marginRight: 5}}
                            />
                        ) : null}
                    </TouchableOpacity>
                ))}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        margin: 10,
        borderRadius: 10,
        paddingTop: 10,
        paddingBottom: 10
    },
    title: {
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 18
    },
    optionContainer: {
        borderRadius: 5,
        borderWidth: 1,
        width: '90%',
        alignSelf: 'center',
        alignItems: 'center',
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    questionText: {
        margin: 10,
        width: '90%',
        alignSelf: 'center'
    },
    answerText: {
        flex: 1,
        fontWeight: 'bold',
        padding: 10
    }
})