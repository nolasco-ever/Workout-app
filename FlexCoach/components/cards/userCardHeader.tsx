import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface UserCardHeaderProps {
    profilePhoto: string;
    welcomeMessage: string;
}

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: 'gray',
    marginBottom: 5,
  },
  currentDate: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
