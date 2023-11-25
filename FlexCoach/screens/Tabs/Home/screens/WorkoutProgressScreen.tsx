import { StyleSheet, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { colors } from '../../../../colors';
import { Button } from '../../../../components/buttons/button';
import { ProgressList } from '../../../../components/progress-indicators/progressList';
import ProgressCircle from '../../../../components/progress-indicators/progressCircle';
import { ScrollView } from 'react-native-gesture-handler';

export const WorkoutProgressScreen = () => {
  const appColors = colors();
  const [fillPercent, setFillPercent] = useState<number>(0);

  const progressListItems = [
    {
      title: 'Overhead Barbell Press',
      description: '3 Sets | 10 Reps',
      onPress: () => console.log(`Pressed!`),
    },
    {
      title: 'Bench Press',
      description: '3 Sets | 10 Reps',
      onPress: () => console.log(`Pressed!`),
    },
    {
      title: 'Barbell Shrug',
      description: '3 Sets | 10 Reps',
      onPress: () => console.log(`Pressed!`),
    },
    {
      title: 'Dumbbell Press',
      description: '3 Sets | 10 Reps',
      onPress: () => console.log(`Pressed!`),
    },
    {
      title: 'Dumbbell Curl',
      description: '3 Sets | 10 Reps',
      onPress: () => console.log(`Pressed!`),
    },
    {
      title: 'Incline Bench Dumbbell Row',
      description: '3 Sets | 10 Reps',
      onPress: () => console.log(`Pressed!`),
    },
    {
      title: 'Tricep Extension',
      description: '3 Sets | 10 Reps',
      onPress: () => console.log(`Pressed!`),
    },
    {
      title: 'Machine Fly',
      description: '3 Sets | 10 Reps',
      onPress: () => console.log(`Pressed!`),
    },
  ];

  const length = progressListItems.length;
  const segmentAmount = 100 / (length - 1);

  useEffect(() => {
    console.log(`fillPercent: ${fillPercent}`);
  }, [fillPercent]);

  const [text, setText] = useState<string>('Press');

  return (
    <View style={[styles.container, { backgroundColor: appColors.background }]}>
      <View style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
        <ProgressCircle
          percent={Math.round(fillPercent)}
          fillColor={appColors.onSuccess}
          centerTextSize="lg"
        />
      </View>
      <ScrollView>
        <ProgressList
          list={progressListItems}
          onComplete={() => setText('Finish')}
          fillPercent={fillPercent}
        />
      </ScrollView>

      {/* <Button
        label={text}
        onPress={() => {
          if (fillPercent < 1) {
            setFillPercent(1);
          } else {
            if (fillPercent + segmentAmount >= 100) {
              setFillPercent(100);
            } else {
              setFillPercent((prev) => prev + segmentAmount);
            }
          }
        }}
      /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
});
