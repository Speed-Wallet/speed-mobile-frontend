import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Image } from 'expo-image';
import colors from '@/constants/colors';

type AvatarProps = {
  user: {
    avatar?: string;
    name: string;
  };
  size?: number;
};

const Avatar = ({ user, size = 40 }: AvatarProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  return (
    <>
      {user.avatar ? (
        <Image
          source={{ uri: user.avatar }}
          style={[
            styles.avatar,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        />
      ) : (
        <View
          style={[
            styles.avatarPlaceholder,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.initialsText, { fontSize: size * 0.4 }]}>
            {getInitials(user.name)}
          </Text>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  avatar: {
    // backgroundColor: colors.backgroundLight,
  },
  avatarPlaceholder: {
    backgroundColor: colors.darkBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: colors.textPrimary,
    fontFamily: 'Inter-SemiBold',
  },
});

export default Avatar;
