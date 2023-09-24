import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { AnimatedImage } from '../../../../components/utils/AnimatedImage'
import { dumbbellAnimation } from '../../../../animations/shared'
import { mockExercises } from '../../../../mocks/trainingDataMocks'
import { ListItem } from '../../../../components/list-items/ListItem'
import { colors } from '../../../../colors'
import { Button } from '../../../../components/buttons/button'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import { HomeStackParams } from '../HomeStack'

export const WorkoutOverviewScreen = () => {
    const navigation = useNavigation<NavigationProp<HomeStackParams>>();
    const appColors = colors();

    return (
        <View style={[styles.container, {backgroundColor: appColors.background}]}>
            <ScrollView>
                <AnimatedImage
                    source={dumbbellAnimation}
                    size={200}
                    loop={false}
                />
                <Text style={styles.description}>Optional desc.: Pump day, do lower weight and higher reps</Text>
                {mockExercises.map((item, index) => (
                    <ListItem
                        key={index}
                        title={item.name}
                        description={item.description}
                    />
                ))}
            </ScrollView>
            <Button
                label='Start'
                onPress={() => navigation.navigate('WorkoutProgressScreen')}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    description: {
        color: 'grey'
    }
})