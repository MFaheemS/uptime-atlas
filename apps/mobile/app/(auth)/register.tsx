import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { z } from 'zod';
import { useAuthStore } from '../../src/store/auth.store';

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function RegisterScreen() {
  const { register } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit() {
    setServerError('');
    const result = schema.safeParse({ name, email, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);
    Keyboard.dismiss();
    try {
      await register(name, email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setServerError(err?.response?.data?.message ?? 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const fields: Array<{
    key: string;
    label: string;
    value: string;
    setter: (v: string) => void;
    secure?: boolean;
    keyboard?: any;
    autoComplete?: any;
  }> = [
    { key: 'name', label: 'Name', value: name, setter: setName, autoComplete: 'name' },
    {
      key: 'email',
      label: 'Email',
      value: email,
      setter: setEmail,
      keyboard: 'email-address',
      autoComplete: 'email',
    },
    {
      key: 'password',
      label: 'Password',
      value: password,
      setter: setPassword,
      secure: true,
      autoComplete: 'new-password',
    },
    {
      key: 'confirmPassword',
      label: 'Confirm Password',
      value: confirmPassword,
      setter: setConfirmPassword,
      secure: true,
      autoComplete: 'new-password',
    },
  ];

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join UptimeAtlas</Text>

          {serverError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{serverError}</Text>
            </View>
          ) : null}

          {fields.map((f) => (
            <View key={f.key} style={styles.field}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                style={[styles.input, errors[f.key] ? styles.inputError : null]}
                value={f.value}
                onChangeText={f.setter}
                secureTextEntry={f.secure}
                keyboardType={f.keyboard}
                autoCapitalize="none"
                autoComplete={f.autoComplete}
                placeholder={f.secure ? '••••••••' : undefined}
              />
              {errors[f.key] ? <Text style={styles.fieldError}>{errors[f.key]}</Text> : null}
            </View>
          ))}

          <TouchableOpacity
            style={[styles.button, isLoading ? styles.buttonDisabled : null]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <Link href="/(auth)/login" style={styles.link}>
            Already have an account? Log in
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f9fafb' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 15, color: '#6b7280', marginTop: -8 },
  errorBox: { backgroundColor: '#fee2e2', borderRadius: 8, padding: 12 },
  errorBoxText: { color: '#dc2626', fontSize: 14 },
  field: { gap: 4 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  inputError: { borderColor: '#ef4444' },
  fieldError: { fontSize: 12, color: '#ef4444' },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { textAlign: 'center', color: '#3b82f6', marginTop: 8 },
});
