import { SafeAreaView, Dimensions, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native'
import React from 'react'
import { colors } from '../../../colors'
import { CustomText } from '../../../components/text/customText';
import { Section } from '../../../components/sections/Section';
import { Button } from '../../../components/buttons/button';
import { AlertBanner } from '../../../components/banners/alertBanner';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { CustomTrainingProgramStackParams } from '../CustomTrainingProgramStack';


type Day = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

export const ReviewYourProgram = ({ route }: { route: any }) => {
    const navigation = useNavigation<NavigationProp<CustomTrainingProgramStackParams, "SuccessScreen">>();

    const { workoutItems, numOfWeeks } = route.params;
    const appColors = colors();
    const screenWidth = Dimensions.get('window').width

    const daysOfWeek: Day[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
        <ScrollView>
            <Section title='Week Breakdown'>                
                <ScrollView horizontal style={{padding: 10, flexDirection: 'row'}}>
                    {daysOfWeek.map((day, index) => (
                        <View
                            style={{
                                margin: 10,
                                padding: 10,
                                borderRadius: 10,
                                width: screenWidth/2,
                                backgroundColor: appColors.onBackground,
                                shadowColor: '#000000',
                                shadowOpacity: useColorScheme() === 'light' ? 0.1 : 0,
                                shadowOffset: {width: 1, height: 1}
                            }}
                            key={index}
                        >
                            <CustomText centered>{daysOfWeek[index]} </CustomText>
                            {workoutItems[index].map((item: string, itemIndex: number) => (
                                <Text key={itemIndex} style={{color: appColors.text}}>{item}</Text>
                            ))}
                        </View>
                    ))}
                    <View style={{paddingRight: 10}}/>
                </ScrollView>
            </Section>
            <Section title='Duration'>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', margin: 10}}>
                    <CustomText>Your program will last for:</CustomText>
                    <CustomText>{numOfWeeks} weeks</CustomText>
                </View>
                <AlertBanner
                    message={`When you're ready, you can begin your program from the home screen. You'll be enrolled for ${numOfWeeks} weeks starting from that day`}
                />
            </Section>
        </ScrollView>
        <Button
            label='Next'
            onPress={() => navigation.navigate('SuccessScreen')}
        />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
})