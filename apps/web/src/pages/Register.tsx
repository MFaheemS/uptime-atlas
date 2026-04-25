import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import api from '../lib/axios';
import { useAuthStore } from '../store/auth.store';

const schema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type Fields = z.infer<typeof schema>;
type FormErrors = Partial<Record<keyof Fields, string>>;

export function Register() {
  const navigate = useNavigate();
  useEffect(() => {
    document.title = 'Create Account — UptimeAtlas';
  }, []);
  const { setToken, setUser } = useAuthStore();
  const [fields, setFields] = useState<Fields>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(key: keyof Fields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');
    const result = schema.safeParse(fields);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0] as keyof FormErrors;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: fields.name,
        email: fields.email,
        password: fields.password,
      });
      setToken(data.accessToken);
      setUser(data.user);
      navigate('/');
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Create account</h2>
      {serverError && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg text-sm">
          {serverError}
        </div>
      )}
      {(['name', 'email', 'password', 'confirmPassword'] as const).map((field) => (
        <div key={field}>
          <label className="block text-sm font-medium mb-1 capitalize">
            {field === 'confirmPassword' ? 'Confirm Password' : field}
          </label>
          <input
            type={field.toLowerCase().includes('password') ? 'password' : 'text'}
            value={fields[field]}
            onChange={(e) => update(field, e.target.value)}
            className={inputClass}
          />
          {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
        </div>
      ))}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2"
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        Register
      </button>
      <p className="text-sm text-center text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
