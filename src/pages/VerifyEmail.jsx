import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Loader2, MailCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import useAuthStore from '@/store/authStore';
import {
  EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS,
  PENDING_VERIFICATION_EMAIL_KEY,
  VERIFICATION_RESEND_UNTIL_KEY,
} from '@/constants/auth';

function maskEmail(email) {
  const [local, domain] = String(email || '').split('@');
  if (!local || !domain) return '';
  const visible = local.slice(0, Math.min(3, local.length));
  return `${visible}${'*'.repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const initialEmail = location.state?.email || sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY) || '';
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    const until = Number(sessionStorage.getItem(VERIFICATION_RESEND_UNTIL_KEY) || 0);
    return Math.max(0, Math.ceil((until - Date.now()) / 1000));
  });

  const maskedEmail = useMemo(() => maskEmail(email.trim().toLowerCase()), [email]);

  useEffect(() => {
    if (secondsRemaining <= 0) return undefined;
    const timer = window.setInterval(() => {
      const until = Number(sessionStorage.getItem(VERIFICATION_RESEND_UNTIL_KEY) || 0);
      setSecondsRemaining(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsRemaining]);

  const handleVerify = async (event) => {
    event.preventDefault();
    setError('');
    try {
      setIsVerifying(true);
      await authService.verifyEmailOtp({ email, token });
      const profile = await authService.getMe();
      const user = profile?.data || profile?.user || profile;
      if (user) login(user);
      sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
      sessionStorage.removeItem(VERIFICATION_RESEND_UNTIL_KEY);
      toast.success('ยืนยันอีเมลสำเร็จ ยินดีต้อนรับสู่ SHARE-ED');
      navigate('/home', { replace: true });
    } catch (verificationError) {
      setError(verificationError?.message || 'ไม่สามารถยืนยันอีเมลได้');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      setIsResending(true);
      await authService.resendVerification(email);
      const normalizedEmail = email.trim().toLowerCase();
      sessionStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, normalizedEmail);
      const resendAt = Date.now() + EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS * 1000;
      sessionStorage.setItem(VERIFICATION_RESEND_UNTIL_KEY, String(resendAt));
      setSecondsRemaining(EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS);
      toast.success('ส่งรหัสยืนยันใหม่แล้ว กรุณาตรวจสอบกล่องจดหมาย');
    } catch (resendError) {
      setError(resendError?.message || 'ไม่สามารถส่งรหัสยืนยันใหม่ได้');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-7 bg-white p-8 sm:p-10 rounded-2xl shadow-soft border border-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-primary">
            <MailCheck className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">ยืนยันอีเมล</h1>
          <p className="mt-2 text-sm text-slate-500">
            {maskedEmail ? `กรอกรหัส 6 หลักที่ส่งไปยัง ${maskedEmail}` : 'กรอกอีเมลและรหัสยืนยัน 6 หลัก'}
          </p>
        </div>

        {error && (
          <div role="alert" className="p-3.5 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5" noValidate>
          <div>
            <label htmlFor="verification-email" className="block text-sm font-medium text-slate-700 mb-1">อีเมล</label>
            <input
              id="verification-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError('');
              }}
              className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label htmlFor="verification-token" className="block text-sm font-medium text-slate-700 mb-1">รหัสยืนยัน</label>
            <input
              id="verification-token"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={token}
              onChange={(event) => {
                setToken(event.target.value.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
              className="block w-full px-4 py-3 border border-slate-200 rounded-lg text-center text-2xl font-bold tracking-[0.5em] text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="000000"
              aria-describedby="verification-help"
            />
            <p id="verification-help" className="mt-2 text-xs text-slate-500 text-center">รหัสมีอายุจำกัด หากหมดอายุให้ขอรหัสใหม่</p>
          </div>

          <button
            type="submit"
            disabled={isVerifying || isResending || token.length !== 6 || !email.trim()}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-primary hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          >
            {isVerifying && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isVerifying ? 'กำลังยืนยัน...' : 'ยืนยันอีเมล'}
          </button>
        </form>

        <div className="space-y-3 text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || isVerifying || secondsRemaining > 0 || !email.trim()}
            className="inline-flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} aria-hidden="true" />
            {secondsRemaining > 0 ? `ส่งรหัสใหม่ได้ใน ${secondsRemaining} วินาที` : 'ส่งรหัสยืนยันใหม่'}
          </button>
          <p className="text-sm text-slate-500">
            <Link to="/login" className="font-medium text-primary hover:text-blue-700">กลับหน้าเข้าสู่ระบบ</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
