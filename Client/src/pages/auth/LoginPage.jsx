import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import AuthLayout from './AuthLayout';
import FormField from '@/components/ui/FormField';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { loginSchema } from '@/auth/schemas';
import { cognitoErrorKey, resendCode } from '@/auth/cognito';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [serverError, setServerError] = useState('');

  const from = location.state?.from?.pathname || '/';
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: location.state?.email || '', password: '' },
  });

  const onSubmit = async ({ email, password }) => {
    setServerError('');
    try {
      const res = await login(email, password);
      if (res.needsVerify) {
        // Email verify nahi hua: naya code bhejo aur verify screen par le jao
        await resendCode(email);
        navigate(`/verify?email=${encodeURIComponent(email)}`);
        return;
      }
      if (!res.ok) return setServerError(t('errors.generic'));
      navigate(from, { replace: true });
    } catch (err) {
      console.error('LOGIN ERROR:', err);
      setServerError(`${t(cognitoErrorKey(err))}  [${err.name}${err.code ? '/' + err.code : ''}: ${err.message}]`);
    }
  };

  return (
    <AuthLayout
      title={t('auth.loginTitle')}
      footer={
        <>
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-medium text-green-600">
            {t('auth.register')}
          </Link>
        </>
      }
    >
      {location.state?.verified && <Alert type="success">{t('auth.verified')}</Alert>}
      {location.state?.passwordReset && <Alert type="success">{t('auth.passwordReset')}</Alert>}
      <Alert>{serverError}</Alert>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email && t(errors.email.message)}
          {...register('email')}
        />
        <FormField
          label={t('auth.password')}
          type="password"
          autoComplete="current-password"
          error={errors.password && t(errors.password.message)}
          {...register('password')}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          {t('auth.login')}
        </Button>
      </form>
      <div className="text-center text-sm">
        <Link to="/forgot-password" className="text-slate-600 underline dark:text-slate-400">
          {t('auth.forgot')}
        </Link>
      </div>
    </AuthLayout>
  );
}
