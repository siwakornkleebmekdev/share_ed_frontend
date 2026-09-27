import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, Lock, User, BookOpen, Loader2, MailCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import useAuthStore from '@/store/authStore';
import {
  EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS,
  PENDING_VERIFICATION_EMAIL_KEY,
  VERIFICATION_RESEND_UNTIL_KEY,
} from '@/constants/auth';
import PasswordVisibilityButton from '@/components/forms/PasswordVisibilityButton';

const MAX_USERNAME_LENGTH = 16;
const USERNAME_LENGTH_ERROR = `ชื่อผู้ใช้ต้องมีความยาวไม่เกิน ${MAX_USERNAME_LENGTH} ตัวอักษร`;

function maskEmail(value) {
  const [local, domain] = String(value || '').split('@');
  if (!local || !domain) return '';
  const visible = local.slice(0, Math.min(3, local.length));
  return `${visible}${'*'.repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({ password: false, confirmPassword: false });
  const [verificationEmail, setVerificationEmail] = useState(
    () => sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY) || '',
  );
  const [verificationToken, setVerificationToken] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    const until = Number(sessionStorage.getItem(VERIFICATION_RESEND_UNTIL_KEY) || 0);
    return Math.max(0, Math.ceil((until - Date.now()) / 1000));
  });

  // Field Errors State for Inline Validation
  const [fieldErrors, setFieldErrors] = useState({});

  const { isAuthenticated, user, login: loginAction } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const isProfileComplete = user?.education_level || user?.user_metadata?.education_level;
    if (isAuthenticated && isProfileComplete) {
      toast.success('คุณมีบัญชีผู้ใช้ในระบบแล้ว');
      navigate('/home');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (secondsRemaining <= 0) return undefined;
    const timer = window.setInterval(() => {
      const until = Number(sessionStorage.getItem(VERIFICATION_RESEND_UNTIL_KEY) || 0);
      setSecondsRemaining(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsRemaining]);

  const checkAvailability = async ({ checkEmail = false, checkUsername = false } = {}) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();

    if ((checkEmail && !normalizedEmail) || (checkUsername && !normalizedUsername)) return true;
    if (checkUsername && normalizedUsername.length > MAX_USERNAME_LENGTH) {
      setFieldErrors(prev => ({ ...prev, username: USERNAME_LENGTH_ERROR }));
      return false;
    }

    try {
      const availability = await authService.checkRegistrationAvailability({
        email: checkEmail ? normalizedEmail : '',
        username: checkUsername ? normalizedUsername : ''
      });
      const availabilityErrors = {};

      if (checkEmail && !availability.emailAvailable) {
        availabilityErrors.email = 'อีเมลนี้ถูกใช้งานแล้ว รวมถึงบัญชีที่สมัครผ่าน Google';
      }
      if (checkUsername && !availability.usernameAvailable) {
        availabilityErrors.username = 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว';
      }

      setFieldErrors(prev => ({
        ...prev,
        ...(checkEmail ? { email: availabilityErrors.email || null } : {}),
        ...(checkUsername ? { username: availabilityErrors.username || null } : {})
      }));
      return Object.keys(availabilityErrors).length === 0;
    } catch {
      return true;
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const newErrors = {};
    if (!username || !username.trim()) {
      newErrors.username = 'กรุณากรอกชื่อผู้ใช้';
    } else if (username.trim().length > MAX_USERNAME_LENGTH) {
      newErrors.username = USERNAME_LENGTH_ERROR;
    }
    if (!email || !email.trim()) {
      newErrors.email = 'กรุณากรอกอีเมล';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }
    if (!educationLevel) {
      newErrors.educationLevel = 'กรุณาเลือกระดับการศึกษา';
    }
    if (!password) {
      newErrors.password = 'กรุณากรอกรหัสผ่าน';
    } else if (password.length < 8) {
      newErrors.password = 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร';
    } else if (!/^[A-Za-z0-9]+$/.test(password)) {
      newErrors.password = 'รหัสผ่านใช้ได้เฉพาะตัวอักษรภาษาอังกฤษและตัวเลขเท่านั้น';
    } else if (!/[A-Za-z]/.test(password)) {
      newErrors.password = 'รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษอย่างน้อย 1 ตัว';
    } else if (!/\d/.test(password)) {
      newErrors.password = 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'กรุณายืนยันรหัสผ่าน';
    } else if (password && confirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = 'รหัสผ่านทั้งสองช่องไม่ตรงกัน';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);

      const availability = await authService.checkRegistrationAvailability({
        email: email.trim().toLowerCase(),
        username: username.trim()
      });
      const duplicateErrors = {};
      if (!availability.emailAvailable) {
        duplicateErrors.email = 'อีเมลนี้ถูกใช้งานแล้ว รวมถึงบัญชีที่สมัครผ่าน Google';
      }
      if (!availability.usernameAvailable) {
        duplicateErrors.username = 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว';
      }
      if (Object.keys(duplicateErrors).length > 0) {
        setFieldErrors(duplicateErrors);
        return;
      }

      const data = await authService.register({
        email: email.trim().toLowerCase(),
        password,
        username: username.trim(),
        education_level: educationLevel,
        age: 0,
        bio: 'ยังไม่ได้ระบุ'
      });

      const registeredUser = data?.session?.user || data?.user || {};
      const meta = registeredUser.user_metadata || {};

      if (data?.requiresEmailVerification) {
        const verificationEmail = email.trim().toLowerCase();
        sessionStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, verificationEmail);
        sessionStorage.setItem(
          VERIFICATION_RESEND_UNTIL_KEY,
          String(Date.now() + EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS * 1000),
        );
        setVerificationEmail(verificationEmail);
        setSecondsRemaining(EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS);
        setVerificationToken('');
        setVerificationError('');
        toast.success('ส่งรหัสยืนยันแล้ว กรุณาตรวจสอบอีเมล');
        return;
      }

      if (!data?.session) {
        toast.success('สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ');
        navigate('/login');
        return;
      }

      loginAction({
        ...registeredUser,
        id: registeredUser.id || 'new_user',
        user_id: registeredUser.id || 'new_user',
        email: email.trim().toLowerCase(),
        name: username.trim(),
        display_name: username.trim(),
        username: username.trim(),
        education_level: educationLevel,
        age: 0,
        bio: 'ยังไม่ได้ระบุ',
        user_metadata: meta
      });

      toast.success('สมัครสมาชิกสำเร็จ ยินดีต้อนรับสู่ SHARE-ED!');
      navigate('/home');
    } catch (error) {
      const message = error.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
      if (message.includes('ชื่อผู้ใช้')) {
        setFieldErrors({ username: message });
      } else if (message.includes('อีเมล')) {
        setFieldErrors({ email: message });
      } else {
        setFieldErrors({ general: message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (event) => {
    event.preventDefault();
    setVerificationError('');
    try {
      setIsVerifying(true);
      await authService.verifyEmailOtp({ email: verificationEmail, token: verificationToken });
      const profile = await authService.getMe();
      const verifiedUser = profile?.data || profile?.user || profile;
      if (verifiedUser) loginAction(verifiedUser);
      sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
      sessionStorage.removeItem(VERIFICATION_RESEND_UNTIL_KEY);
      toast.success('ยืนยันอีเมลสำเร็จ ยินดีต้อนรับสู่ SHARE-ED');
      navigate('/home', { replace: true });
    } catch (error) {
      setVerificationError(error?.message || 'ไม่สามารถยืนยันอีเมลได้');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    setVerificationError('');
    try {
      setIsResending(true);
      await authService.resendVerification(verificationEmail);
      const resendAt = Date.now() + EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS * 1000;
      sessionStorage.setItem(VERIFICATION_RESEND_UNTIL_KEY, String(resendAt));
      setSecondsRemaining(EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS);
      toast.success('ส่งรหัสยืนยันใหม่แล้ว กรุณาตรวจสอบกล่องจดหมาย');
    } catch (error) {
      setVerificationError(error?.message || 'ไม่สามารถส่งรหัสยืนยันใหม่ได้');
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeRegistrationEmail = () => {
    sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
    sessionStorage.removeItem(VERIFICATION_RESEND_UNTIL_KEY);
    setVerificationEmail('');
    setVerificationToken('');
    setVerificationError('');
    setSecondsRemaining(0);
    setEmail('');
    setUsername('');
    setFieldErrors(prev => ({ ...prev, email: null, username: null, general: null }));
    toast('กรุณากรอกอีเมลและชื่อผู้ใช้ใหม่ เนื่องจากรายการเดิมถูกส่งไปสมัครแล้ว');
  };

  if (verificationEmail) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-7 bg-white p-8 sm:p-10 rounded-2xl shadow-soft border border-slate-100">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-primary">
              <MailCheck className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">ยืนยันอีเมลเพื่อสมัครสมาชิก</h2>
            <p className="mt-2 text-sm text-slate-500">
              กรอกรหัส 6 หลักที่ส่งไปยัง {maskEmail(verificationEmail)}
            </p>
          </div>

          {verificationError && (
            <div role="alert" className="p-3.5 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 text-center">
              {verificationError}
            </div>
          )}

          <form onSubmit={handleVerifyEmail} className="space-y-5" noValidate>
            <div>
              <label htmlFor="register-verification-token" className="block text-sm font-medium text-slate-700 mb-1">รหัสยืนยันอีเมล</label>
              <input
                id="register-verification-token"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                value={verificationToken}
                onChange={(event) => {
                  setVerificationToken(event.target.value.replace(/\D/g, '').slice(0, 6));
                  setVerificationError('');
                }}
                className="block w-full px-4 py-3 border border-slate-200 rounded-lg text-center text-2xl font-bold tracking-[0.5em] text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="000000"
              />
              <p className="mt-2 text-xs text-slate-500 text-center">กรุณายืนยันอีเมลให้สำเร็จก่อนเข้าใช้งาน</p>
            </div>

            <button
              type="submit"
              disabled={isVerifying || isResending || verificationToken.length !== 6}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-primary hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {isVerifying && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isVerifying ? 'กำลังยืนยัน...' : 'ยืนยันและสมัครสมาชิกให้เสร็จสิ้น'}
            </button>
          </form>

          <div className="space-y-3 text-center">
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={isResending || isVerifying || secondsRemaining > 0}
              className="inline-flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} aria-hidden="true" />
              {secondsRemaining > 0 ? `ส่งรหัสใหม่ได้ใน ${secondsRemaining} วินาที` : 'ส่งรหัสยืนยันใหม่'}
            </button>
            <div>
              <button
                type="button"
                onClick={handleChangeRegistrationEmail}
                disabled={isVerifying || isResending}
                className="text-sm font-medium text-slate-500 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                กลับหน้าสมัครสมาชิกใหม่
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-soft border border-slate-100">
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">สร้างบัญชีผู้ใช้</h2>
          <p className="mt-2 text-sm text-slate-500">
            มีบัญชีผู้ใช้แล้วใช่ไหม?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-blue-700 transition-colors">
              เข้าสู่ระบบที่นี่
            </Link>
          </p>
        </div>

        {fieldErrors.general && (
          <div className="p-3.5 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 text-center">
            {fieldErrors.general}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleRegister} noValidate>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-slate-700">ชื่อผู้ใช้ (Username) <span className="text-red-500">*</span></label>
                <p className="shrink-0 text-xs text-slate-400" aria-live="polite">
                  {username.length}/{MAX_USERNAME_LENGTH}
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className={`h-5 w-5 ${fieldErrors.username ? 'text-red-400' : 'text-slate-400'}`} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    const nextUsername = e.target.value;
                    if (nextUsername.length > MAX_USERNAME_LENGTH) {
                      setFieldErrors(prev => ({ ...prev, username: USERNAME_LENGTH_ERROR }));
                      return;
                    }
                    setUsername(nextUsername);
                    if (fieldErrors.username) setFieldErrors(prev => ({ ...prev, username: null }));
                  }}
                  onBlur={() => checkAvailability({ checkUsername: true })}
                  aria-invalid={Boolean(fieldErrors.username)}
                  aria-describedby={fieldErrors.username ? "register-username-error" : undefined}
                  className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none transition-colors ${fieldErrors.username
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                    }`}
                  placeholder="ชื่อผู้ใช้ เช่น JohnDoe"
                />
              </div>
              {fieldErrors.username && (
                <p id="register-username-error" className="mt-1 text-xs text-red-500 font-medium" role="alert">{fieldErrors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">อีเมล <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${fieldErrors.email ? 'text-red-400' : 'text-slate-400'}`} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null }));
                  }}
                  onBlur={() => {
                    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                      checkAvailability({ checkEmail: true });
                    }
                  }}
                  className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none transition-colors ${fieldErrors.email
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                    }`}
                  placeholder="name@example.com"
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ระดับการศึกษา <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BookOpen className={`h-5 w-5 ${fieldErrors.educationLevel ? 'text-red-400' : 'text-slate-400'}`} />
                </div>
                <select
                  value={educationLevel}
                  onChange={(e) => {
                    setEducationLevel(e.target.value);
                    if (fieldErrors.educationLevel) setFieldErrors(prev => ({ ...prev, educationLevel: null }));
                  }}
                  className={`block w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none transition-colors bg-white text-slate-900 appearance-none ${fieldErrors.educationLevel
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                    }`}
                >
                  <option value="" disabled>เลือกระดับการศึกษา</option>
                  <option value="MIDDLE_SCHOOL">มัธยมศึกษาตอนต้น</option>
                  <option value="HIGH_SCHOOL">มัธยมศึกษาตอนปลาย</option>
                  <option value="UNIVERSITY">มหาวิทยาลัย</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {fieldErrors.educationLevel && (
                <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.educationLevel}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${fieldErrors.password ? 'text-red-400' : 'text-slate-400'}`} />
                </div>
                <input
                  type={visiblePasswords.password ? 'text' : 'password'}
                  pattern="[A-Za-z0-9]+"
                  title="ใช้ได้เฉพาะตัวอักษรภาษาอังกฤษและตัวเลขเท่านั้น"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: null }));
                  }}
                  className={`block w-full pl-10 pr-12 py-2.5 border rounded-lg focus:outline-none transition-colors ${fieldErrors.password
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                    }`}
                  placeholder="รหัสผ่านอย่างน้อย 8 ตัว"
                />
                <PasswordVisibilityButton
                  visible={visiblePasswords.password}
                  onToggle={() => setVisiblePasswords(current => ({ ...current, password: !current.password }))}
                />
              </div>
              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <p className="font-medium text-slate-700">เงื่อนไขการตั้งรหัสผ่าน</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  <li>มีความยาวอย่างน้อย 8 ตัวอักษร</li>
                  <li>มีตัวอักษรภาษาอังกฤษอย่างน้อย 1 ตัว</li>
                  <li>มีตัวเลขอย่างน้อย 1 ตัว</li>
                  <li>ใช้ได้เฉพาะ A-Z, a-z และ 0-9</li>
                </ul>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ยืนยันรหัสผ่าน <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${fieldErrors.confirmPassword ? 'text-red-400' : 'text-slate-400'}`} />
                </div>
                <input
                  type={visiblePasswords.confirmPassword ? 'text' : 'password'}
                  pattern="[A-Za-z0-9]+"
                  title="ใช้ได้เฉพาะตัวอักษรภาษาอังกฤษและตัวเลขเท่านั้น"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: null }));
                  }}
                  className={`block w-full pl-10 pr-12 py-2.5 border rounded-lg focus:outline-none transition-colors ${fieldErrors.confirmPassword
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                    }`}
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                />
                <PasswordVisibilityButton
                  visible={visiblePasswords.confirmPassword}
                  onToggle={() => setVisiblePasswords(current => ({ ...current, confirmPassword: !current.confirmPassword }))}
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                กำลังสมัครสมาชิก...
              </>
            ) : (
              'สมัครสมาชิก'
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
