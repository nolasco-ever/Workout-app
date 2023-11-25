import { StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { ListItem } from '../list-items/ListItem';
import { directionIcons, generalIcons } from '../icons/icon-library';
import { colors } from '../../colors';
import { animated, useSpring } from '@react-spring/native';

interface ProgressListProps {
  list: {
    title: string;
    description?: string;
    onPress: () => void;
  }[];
  onComplete?: () => void;
  fillPercent: number;
}

export const ProgressList = ({ list, onComplete, fillPercent }: ProgressListProps) => {
  const appColors = colors();

  const length = list.length;
  const segmentAmount = 100 / (length - 1);

  const [viewHeight, setViewHeight] = useState<number>();

  const [prevFill, setPrevFill] = useState<number>(0);
  const [currentFill, setCurrentFill] = useState<number>(fillPercent);

  const [currHeight, setCurrHeight] = useState<number>();
  const [parentHeight, setParentHeight] = useState<number>();

  const onIncreaseStyle = () => {
    return useSpring({
      height: `${currentFill}%`,

      from: {
        height: `${prevFill}%`,
      },

      config: {
        mass: 1,
        tension: 100,
        friction: 20,
      },
    });
  };

  const getIconProps = (index: number) => {
    const heightPercent =
      currHeight && parentHeight ? Math.round((currHeight / parentHeight) * 100) : 0;
    let iconName;
    let iconColor;

    if (index === length - 1) {
      if (heightPercent < 100) {
        iconName = generalIcons.bulletPoint;
        iconColor = appColors.lightGrey;
      } else {
        iconName = generalIcons.success;
        iconColor = appColors.onSuccess;
      }
    } else {
      if (heightPercent < Math.round(1 + segmentAmount * index)) {
        iconName = generalIcons.bulletPoint;
        iconColor = appColors.lightGrey;
      } else {
        iconName = generalIcons.success;
        iconColor = appColors.onSuccess;
      }
    }

    return {
      iconName,
      iconColor,
    };
  };

  useEffect(() => {
    setPrevFill(currentFill);
    setCurrentFill(Math.round(fillPercent));

    if (fillPercent >= 100) {
      onComplete?.();
    }
  }, [fillPercent]);

  return (
    <View style={styles.container}>
      <View style={[styles.progressBarContainer, { height: viewHeight }]}>
        <View
          onLayout={(e) => setParentHeight(e.nativeEvent.layout.height)}
          style={[styles.progressBarBackground, { backgroundColor: appColors.lightGrey }]}
        >
          <animated.View
            onLayout={(e) => setCurrHeight(e.nativeEvent.layout.height)}
            style={[
              styles.progressBarFill,
              { backgroundColor: appColors.onSuccess },
              onIncreaseStyle(),
            ]}
          />
        </View>
      </View>
      <View
        style={styles.listItemContainer}
        onLayout={(e) => setViewHeight(e.nativeEvent.layout.height)}
      >
        {list.map((item, index) => (
          <ListItem
            key={index}
            title={item.title}
            description={item.description}
            rightIcon={directionIcons['angleRight']}
            onPress={item.onPress}
            icon={getIconProps(index).iconName}
            iconSize={35}
            iconColor={getIconProps(index).iconColor}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flex: 1,
  },
  progressBarContainer: {
    width: '15%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '15%',
    height: '85%',
    borderRadius: 25,
  },
  progressBarFill: {
    borderRadius: 25,
  },
  listItemContainer: {
    width: '100%',
    position: 'absolute',
  },
});
