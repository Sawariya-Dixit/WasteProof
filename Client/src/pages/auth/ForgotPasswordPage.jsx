import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import AuthLayout from './AuthLayout';
import FormField from '@/components/ui/FormField';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { forgotEmailSchema, resetSchema } from '@/auth/schemas';
import { cognitoErrorKey, confirmPasswordReset, requestPasswordReset } from '@/auth/cognito';

// Do step: (1) email do, code aata hai  (2) code + naya password
export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  return email ? <StepReset email={email} t={t} /> : <StepEmail onSent={setEmail} t={t} />;
}

function StepEmail({ onSent, t }) {
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotEmailSchema) });

  const onSubmit = async ({ email }) => {
    setServerError('');
    try {
      await requestPasswordReset(email);
      onSent(email);
    } catch (err) {
      setServerError(t(cognitoErrorKey(err)));
    }
  };

  return (
    <AuthLayout
      title={t('auth.forgotTitle')}
      footer={
        <Link to="/login" className="font-medium text-green-600">
          {t('common.back')}
        </Link>
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
        <Button type="submit" loading={isSubmitting} className="w-full">
          {t('auth.sendCode')}
        </Button>
      </form>
    </AuthLayout>
  );
}

function StepReset({ email, t }) {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(resetSchema) });

  const onSubmit = async ({ code, newPassword }) => {
    setServerError('');
    try {
      await confirmPasswordReset(email, code, newPassword);
      navigate('/login', { replace: true, state: { passwordReset: true, email } });
    } catch (err) {
      setServerError(t(cognitoErrorKey(err)));
    }
  };

  return (
    <AuthLayout title={t('auth.forgotTitle')} hint={t('auth.verifyHint', { email })}>
      <Alert>{serverError}</Alert>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          label={t('auth.code')}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          error={errors.code && t(errors.code.message)}
          {...register('code')}
        />
        <FormField
          label={t('auth.newPassword')}
          type="password"
          autoComplete="new-password"
          error={errors.newPassword && t(errors.newPassword.message)}
          {...register('newPassword')}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          {t('auth.resetPassword')}
        </Button>
      </form>
    </AuthLayout>
  );
}
