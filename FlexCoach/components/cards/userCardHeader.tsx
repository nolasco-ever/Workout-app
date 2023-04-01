import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { NotificationButton } from '../buttons/notificationButton';
import { colors } from '../../colors';

interface UserCardHeaderProps {
    profilePhoto: string;
    welcomeMessage: string;
}

export const UserCardHeader = ({ profilePhoto, welcomeMessage }: UserCardHeaderProps) => {
    const appColors = colors();
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });


  return (
    <View style={[styles.container, {backgroundColor: appColors.background}]}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: profilePhoto }} style={styles.image} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.welcomeMessage, {color: appColors.subtext}]}>{welcomeMessage}</Text>
        <Text style={[styles.currentDate, {color: appColors.text}]}>{currentDate}</Text>
      </View>
      <NotificationButton
        unseenNotifications={true}
        onPress={() => console.log('pressed')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  imageContainer: {
    margin: 10,
    borderRadius: 50,
    overflow: 'hidden',
  },
  image: {
    width: 40,
    height: 40,
  },
  textContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingRight: 10,
  },
  welcomeMessage: {
    fontSize: 12,
    marginBottom: 5,
  },
  currentDate: {
    fontWeight: 'bold',
    fontSize: 16
  },
});
