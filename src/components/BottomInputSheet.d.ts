import React from 'react';

export interface BottomInputSheetProps {
  visible: boolean;
  title: string;
  placeholder: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  defaultValue?: string;
}

/**
 * A reusable bottom sheet for text input with slide-up animation, blurred background, and keyboard handling.
 */
declare const BottomInputSheet: React.FC<BottomInputSheetProps>;

export default BottomInputSheet;
