import React, { useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform, Dimensions, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';

interface InputBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  visible: boolean;
}

const PRIMARY_ACCENT = '#3498db';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const InputBar: React.FC<InputBarProps> = ({
  value,
  onChangeText,
  onSend,
  placeholder = '',
  disabled = false,
  autoFocus = false,
  visible = false,
}) => {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide up and fade in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (autoFocus && inputRef.current) {
          inputRef.current.focus();
        }
      });
    } else {
      // Slide down and fade out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim, autoFocus]);

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.overlay,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        }
      ]}
    >
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[styles.container, { paddingBottom: insets.bottom || 12 }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#aaa"
            value={value}
            onChangeText={onChangeText}
            editable={!disabled}
            autoFocus={autoFocus}
            multiline
            blurOnSubmit
            onSubmitEditing={onSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendButton, (!value.trim() || disabled) && { opacity: 0.5 }]}
            onPress={onSend}
            disabled={!value.trim() || disabled}
          >
            <Send color="#fff" size={22} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: SCREEN_WIDTH,
    zIndex: 9999,
  },
  container: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#333',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    marginBottom: 6,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    minHeight: 40,
    maxHeight: 120,
    paddingRight: 45,
    textAlignVertical: 'top',
    backgroundColor: 'transparent',
  },
  sendButton: {
    backgroundColor: PRIMARY_ACCENT,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
    bottom: 8,
  },
});

export default InputBar;
