import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const PRIMARY_ACCENT = '#3498db';

interface BottomInputSheetProps {
  visible: boolean;
  title: string;
  placeholder: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  defaultValue?: string;
}

export const BottomInputSheet: React.FC<BottomInputSheetProps> = ({
  visible,
  title,
  placeholder,
  onSubmit,
  onCancel,
  defaultValue = '',
}) => {
  const [input, setInput] = React.useState(defaultValue);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
      });
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setInput(defaultValue));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Dismiss keyboard on tap outside
  const handleDismiss = () => {
    Keyboard.dismiss();
    onCancel();
  };

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Blurred background */}
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <BlurView intensity={40} tint="dark" style={styles.blur} />
      </TouchableWithoutFeedback>
      {/* Bottom sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>
        <View style={styles.inputRowWrapper}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.inputRow}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder={placeholder}
              placeholderTextColor="#aaa"
              value={input}
              onChangeText={setInput}
              autoFocus
              multiline
              blurOnSubmit
              onSubmitEditing={() => {
                if (input.trim()) onSubmit(input.trim());
              }}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.sendButton, !input.trim() && { opacity: 0.5 }]}
              disabled={!input.trim()}
              onPress={() => onSubmit(input.trim())}
            >
              <Text style={styles.sendIcon}>→</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
        {/* Sticky buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  blur: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#23243a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    paddingBottom: 34,
    paddingHorizontal: 22,
    minHeight: 220,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#444',
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    textAlign: 'center',
  },
  inputRowWrapper: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#333',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    minHeight: 40,
    maxHeight: 120,
    paddingRight: 45,
    textAlignVertical: 'top',
    backgroundColor: 'transparent', // Ensure background is transparent so text is visible
    zIndex: 2,
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
    bottom: 5,
  },
  sendIcon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 6,
    paddingBottom: 2,
  },
  cancelBtn: {
    backgroundColor: '#35354a',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  cancelText: {
    color: '#bbb',
    fontWeight: '500',
    fontSize: 16,
  },
});

export default BottomInputSheet;
