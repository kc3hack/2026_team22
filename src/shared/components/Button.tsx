import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS } from '../constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * 汎用ボタンコンポーネント
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
}) => {
  const buttonStyles = [
    styles.button,
    variant === 'primary' && styles.primaryButton,
    variant === 'secondary' && styles.secondaryButton,
    variant === 'outline' && styles.outlineButton,
    disabled && styles.disabledButton,
    style,
  ];

  const textStyles = [
    styles.text,
    variant === 'outline' && styles.outlineText,
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity style={buttonStyles} onPress={onPress} disabled={disabled}>
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  text: {
    color: COLORS.text.dark,
    fontSize: 16,
    fontWeight: '600',
  },
  outlineText: {
    color: COLORS.primary,
  },
  disabledText: {
    color: COLORS.text.dark,
  },
});
