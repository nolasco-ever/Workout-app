import React, { useState } from 'react';
import { Platform, TextInput, TextInputProps } from 'react-native';

/**
 * A TextInput that selects its contents on focus, so a prefilled value is
 * replaced by whatever gets typed.
 *
 * iOS uses `selectTextOnFocus`. On Android that prop re-selects the text
 * after the first keystroke into a controlled input, so the second
 * keystroke replaced the first: typing 60.5 into a weight box gave 0.5.
 * There the selection is set once on focus and released on the first edit.
 */
export const SelectAllTextInput = ({ value, onFocus, onChangeText, onBlur, ...rest }: TextInputProps) => {
  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>(undefined);
  if (Platform.OS !== 'android') {
    return <TextInput value={value} selectTextOnFocus onFocus={onFocus} onChangeText={onChangeText} onBlur={onBlur} {...rest} />;
  }
  return (
    <TextInput
      value={value}
      selection={selection}
      onFocus={e => {
        setSelection({ start: 0, end: (value ?? '').length });
        onFocus?.(e);
      }}
      onChangeText={text => {
        setSelection(undefined);
        onChangeText?.(text);
      }}
      onBlur={e => {
        setSelection(undefined);
        onBlur?.(e);
      }}
      {...rest}
    />
  );
};
