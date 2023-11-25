import { StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { colors } from '../../colors';
import { animated, useSpring } from '@react-spring/native';

type ProgressBarProps = {
  title?: string;
  percent: number;
  showPercent?: boolean;
  setProgressCompleted?: React.Dispatch<React.SetStateAction<boolean>>;
  fillColor?: string;
};

export const ProgressBar = ({
  title,
  percent,
  showPercent = false,
  setProgressCompleted,
  fillColor,
}: ProgressBarProps) => {
  const appColors = colors();

  const [prevFill, setPrevFill] = useState<string>('0%');
  const [currentFill, setCurrentFill] = useState<string>(`${Math.round(percent * 100)}%`);
  // const fill = `${Math.round(percent*100)}%`

  const onIncreaseStyle = () => {
    return useSpring({
      width: currentFill,

      from: {
        width: prevFill,
      },

      config: {
        mass: 1,
        tension: 100,
        friction: 20,
      },
    });
  };

  useEffect(() => {
    setPrevFill(currentFill);
    setCurrentFill(Math.round(percent * 100) > 100 ? '100%' : `${Math.round(percent * 100)}%`);

    if (percent > 1 && setProgressCompleted) {
      setTimeout(() => {
        setProgressCompleted(true);
      }, 500);
    }
  }, [percent]);

  return (
    <View style={[styles.container]}>
      {title && (
        <Text style={[styles.bodyText, { fontWeight: '700', color: appColors.text }]}>{title}</Text>
      )}
      <View style={[styles.barContainer, { backgroundColor: appColors.inactive }]}>
        <animated.View
          style={[
            styles.fillBar,
            {
              width: currentFill,
              backgroundColor: fillColor || appColors.secondary,
            },
            onIncreaseStyle(),
          ]}
        />
      </View>

      {showPercent ? (
        <View>
          <Text style={[styles.bodyText, { color: appColors.text }]}>{currentFill}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  barContainer: {
    width: '100%',
    borderRadius: 3,
  },
  fillBar: {
    height: 15,
    borderRadius: 3,
  },
  bodyText: {
    fontSize: 16,
  },
});
