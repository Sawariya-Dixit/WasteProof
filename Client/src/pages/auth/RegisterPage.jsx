import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import AuthLayout from './AuthLayout';
import FormField from '@/components/ui/FormField';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { registerSchema } from '@/auth/schemas';
import { cognitoErrorKey, registerUser } from '@/auth/cognito';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async ({ email, password }) => {
    setServerError('');
    try {
      await registerUser(email, password);
      // Cognito email par 6 digit code bhejta hai
      navigate(`/verify?email=${encodeURIComponent(email)}`);
       } catch (err) {
      console.error('REGISTER ERROR:', err);
      setServerError(`${t(cognitoErrorKey(err))}  [${err.name}: ${err.message}]`);
    }
  };

  return (
    <AuthLayout
      title={t('auth.registerTitle')}
      footer={
        <>
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="font-medium text-green-600">
            {t('auth.login')}
          </Link>
        </>
      }
    >
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
          autoComplete="new-password"
          error={errors.password && t(errors.password.message)}
          {...register('password')}
        />
        <FormField
          label={t('auth.confirmPassword')}
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword && t(errors.confirmPassword.message)}
          {...register('confirmPassword')}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          {t('auth.register')}
        </Button>
      </form>
    </AuthLayout>
  );
}
