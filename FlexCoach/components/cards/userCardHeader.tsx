import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { NotificationButton } from '../buttons/notificationButton';
import { colors } from '../../colors';

interface UserCardHeaderProps {
    profilePhoto: string;
    welcomeMessage: string;
}

const appColors = colors();

export const UserCardHeader = ({ profilePhoto, welcomeMessage }: UserCardHeaderProps) => {
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });


  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: profilePhoto }} style={styles.image} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.welcomeMessage}>{welcomeMessage}</Text>
        <Text style={styles.currentDate}>{currentDate}</Text>
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
    width: 50,
    height: 50,
  },
  textContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingRight: 10,
  },
  welcomeMessage: {
    fontSize: 12,
    color: appColors.subtext,
    marginBottom: 5,
  },
  currentDate: {
    fontWeight: 'bold',
    fontSize: 16,
    color: appColors.text
  },
});
