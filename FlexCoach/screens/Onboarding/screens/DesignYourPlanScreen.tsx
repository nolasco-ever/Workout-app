import { Dimensions, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { colors } from '../../../colors';
import { CustomText } from '../../../components/text/customText';
import { Button } from '../../../components/buttons/button';
import { ListItem } from '../../../components/list-items/ListItem';
import { directionIcons } from '../../../components/icons/icon-library';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { OnboardingStackParams } from '../OnboardingStack';
import { AppStackParams } from '../../../appNavigators/AppStack';

export const DesignYourPlanScreen = () => {
    const navigation = useNavigation<NavigationProp<OnboardingStackParams | AppStackParams>>();

    const appColors = colors();
    const screenWidth = Dimensions.get('window').width;
    
    return (
        <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
            <View style={styles.textContainer}>
                <CustomText type='subheader'>Tailor your fitness journey by creating a training program and/or diet plan that caters to your unique needs</CustomText>
            </View>
            <View style={styles.listItemContainer}>
                <ListItem
                    title='Create Your Custom Training Program'
                    rightIcon={directionIcons.angleRight}
                    onPress={() => (navigation as NavigationProp<AppStackParams>).navigate('CustomTrainingProgramStack')}
                />
                <ListItem
                    title='Create Your Custom Diet Plan'
                    rightIcon={directionIcons.angleRight}
                />
            </View>
            <View style={styles.buttonsContainer}>
                <Button
                    label='Next'
                    onPress={() => (navigation as NavigationProp<OnboardingStackParams>).navigate('SuccessScreen')}
                />
                <Button
                    label='Maybe Later'
                    type='outline'
                    onPress={() => (navigation as NavigationProp<OnboardingStackParams>).navigate('SuccessScreen')}
                />
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    textContainer: {
        padding: 10
    },
    listItemContainer: {
        flex: 1
    },
    buttonsContainer: {
        alignItems: 'center',
    }
})