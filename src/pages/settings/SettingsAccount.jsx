import { useState, useEffect } from "react";
import { Mail, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "@/store/authStore";
import { authService } from "@/services/auth.service";
import { profileService } from "@/services/profile.service";

// Notification preferences UI removed per request

export default function SettingsAccount() {
  const { user, login } = useAuthStore();

  const [email, setEmail] = useState("");
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState(null);

  const [passwords, setPasswords] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || "");
  }, [user]);

  const handleSaveEmail = async (e) => {
    e.preventDefault();
    setEmailError(null);
    if (!email || email === user?.email) return;
    setIsSavingEmail(true);
    try {
      await authService.updateAccount({ email });
      toast.success(
        "ส่งอีเมลยืนยันการเปลี่ยนแปลงแล้ว กรุณาตรวจสอบกล่องจดหมายของคุณ",
      );
    } catch (error) {
      console.error("Update email error:", error);
      setEmailError(error?.message || "ไม่สามารถเปลี่ยนอีเมลได้ในขณะนี้");
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);

    if (passwords.password.length < 8) {
      setPasswordError("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (passwords.password !== passwords.confirmPassword) {
      setPasswordError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setIsSavingPassword(true);
    try {
      await authService.updateAccount({ password: passwords.password });
      setPasswords({ password: "", confirmPassword: "" });
      toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
    } catch (error) {
      console.error("Update password error:", error);
      setPasswordError(error?.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้ในขณะนี้");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">ตั้งค่าบัญชี</h1>
        <p className="text-slate-500 mt-1">
          อีเมล รหัสผ่าน และการแจ้งเตือนของคุณ
        </p>
      </div>

      {/* Email */}
      <form
        onSubmit={handleSaveEmail}
        className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-4"
      >
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <Mail className="h-5 w-5 text-slate-400" /> อีเมล
        </h3>
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2">
            ที่อยู่อีเมล
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none transition-all text-slate-800 font-medium ${
              emailError
                ? "border-red-500 focus:ring-4 focus:ring-red-500/10 focus:border-red-500"
                : "border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary"
            }`}
            placeholder="you@example.com"
          />
          {emailError ? (
            <p className="text-xs text-red-500 font-medium mt-1.5">
              {emailError}
            </p>
          ) : (
            <p className="text-xs text-slate-400 mt-2">
              การเปลี่ยนอีเมลต้องได้รับการยืนยันผ่านลิงก์ที่ส่งไปยังอีเมลใหม่
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSavingEmail || !email || email === user?.email}
          className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
        >
          {isSavingEmail ? "กำลังบันทึก..." : "บันทึกอีเมล"}
        </button>
      </form>

      {/* Password */}
      <form
        onSubmit={handleSavePassword}
        className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-4"
      >
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-slate-400" /> รหัสผ่าน
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              รหัสผ่านใหม่
            </label>
            <input
              type="password"
              value={passwords.password}
              onChange={(e) => {
                setPasswords((prev) => ({ ...prev, password: e.target.value }));
                if (passwordError) setPasswordError(null);
              }}
              className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none transition-all text-slate-800 font-medium ${
                passwordError
                  ? "border-red-500 focus:ring-4 focus:ring-red-500/10 focus:border-red-500"
                  : "border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary"
              }`}
              placeholder="อย่างน้อย 8 ตัวอักษร"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              ยืนยันรหัสผ่านใหม่
            </label>
            <input
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => {
                setPasswords((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }));
                if (passwordError) setPasswordError(null);
              }}
              className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none transition-all text-slate-800 font-medium ${
                passwordError
                  ? "border-red-500 focus:ring-4 focus:ring-red-500/10 focus:border-red-500"
                  : "border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary"
              }`}
              placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
            />
          </div>
        </div>
        {passwordError && (
          <p className="text-xs text-red-500 font-medium mt-1">
            {passwordError}
          </p>
        )}
        <button
          type="submit"
          disabled={
            isSavingPassword ||
            !passwords.password ||
            !passwords.confirmPassword
          }
          className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
        >
          {isSavingPassword ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
        </button>
      </form>

      {/* Notification preferences removed */}
    </div>
  );
}
