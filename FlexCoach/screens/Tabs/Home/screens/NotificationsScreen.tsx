import React from 'react';
import { StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { colors } from '../../../../colors';
import { generalIcons } from '../../../../components/icons/icon-library';
import { ListItem } from '../../../../components/list-items/ListItem';
import { Section } from '../../../../components/sections/Section';
import { mockNotificationMessages } from '../../../../mocks/listItemMocks';


export const NotificationsScreen = () => {
  const appColors = colors();

  const getIcon = (type: string) => {
    switch (type) {
      case 'pr':
        return generalIcons.trophy;
      case 'diet':
        return generalIcons.apple;
      case 'health':
        return generalIcons.heart;
      case 'workout':
        return generalIcons.dumbbell;
      case 'news':
        return generalIcons.book;
      default:
        return generalIcons.bell;
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'pr':
        return appColors.onWarning;
      case 'diet':
        return appColors.onSuccess;
      case 'health':
        return appColors.onError;
      case 'workout':
        return appColors.onInfo;
      case 'news':
        return appColors.secondary;
      default:
        return appColors.primary;
    }
    // return appColors.primary
  }

  const optionsList = [
    {
      title: "Remove notification",
      description: 'Remove this notification from the list',
      icon: generalIcons.xMarkCircle
    },
    {
      title: "Don't show me this type of notification",
      description: 'Stop receiving these kinds of notifications',
      icon: generalIcons.bellSlash
    },
    {
      title: "Manage notifications",
      description: 'Choose what kinds of notifications you receive',
      icon: generalIcons.gear
    }
  ];

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
      <ScrollView>
        <Section title='Today' titleFontSize={16}>
          {mockNotificationMessages.filter(item => item.date === 'Today').map(item => {
            return (
              <ListItem
                key={item.id}
                icon={getIcon(item.type)}
                iconSize={30}
                iconColor={getIconColor(item.type)}
                title={item.title}
                description={item.message}
                rightText={item.timePassed}
                options={optionsList}
              />
            );
          })}
        </Section>
        <Section title='Yesterday' titleFontSize={16}>
          {mockNotificationMessages.filter(item => item.date === 'Yesterday').map(item => {
            return (
              <ListItem
                key={item.id}
                icon={getIcon(item.type)}
                iconSize={30}
                iconColor={getIconColor(item.type)}
                title={item.title}
                description={item.message}
                rightText={item.timePassed}
                options={optionsList}
              />
            );
          })}
        </Section>
        <Section title='Last Week' titleFontSize={16}>
          {mockNotificationMessages.filter(item => item.date === 'Last Week').map(item => {
            return (
              <ListItem
                key={item.id}
                icon={getIcon(item.type)}
                iconSize={30}
                iconColor={getIconColor(item.type)}
                title={item.title}
                description={item.message}
                rightText={item.timePassed}
                options={optionsList}
              />
            );
          })}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});