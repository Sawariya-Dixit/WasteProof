import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import AuthLayout from './AuthLayout';
import FormField from '@/components/ui/FormField';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { verifySchema } from '@/auth/schemas';
import { cognitoErrorKey, confirmRegistration, resendCode } from '@/auth/cognito';

export default function VerifyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const [serverError, setServerError] = useState('');
  const [info, setInfo] = useState('');
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(verifySchema) });

  if (!email) return <Navigate to="/register" replace />;

  const onSubmit = async ({ code }) => {
    setServerError('');
    setInfo('');
    try {
      await confirmRegistration(email, code);
      navigate('/login', { replace: true, state: { verified: true, email } });
    } catch (err) {
      setServerError(t(cognitoErrorKey(err)));
    }
  };

  const onResend = async () => {
    setServerError('');
    setInfo('');
    setResending(true);
    try {
      await resendCode(email);
      setInfo(t('auth.codeSent'));
    } catch (err) {
      setServerError(t(cognitoErrorKey(err)));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout title={t('auth.verifyTitle')} hint={t('auth.verifyHint', { email })}>
      <Alert>{serverError}</Alert>
      <Alert type="success">{info}</Alert>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          label={t('auth.code')}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          error={errors.code && t(errors.code.message)}
          {...register('code')}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          {t('auth.verify')}
        </Button>
      </form>
      <Button variant="ghost" loading={resending} onClick={onResend} className="w-full">
        {t('auth.resend')}
      </Button>
    </AuthLayout>
  );
}
