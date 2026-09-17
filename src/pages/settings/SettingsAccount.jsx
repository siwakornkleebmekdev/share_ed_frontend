import { useState } from "react";
import { KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import { authService } from "@/services/auth.service";

// Notification preferences UI removed per request

export default function SettingsAccount() {
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [isCurrentPasswordVerified, setIsCurrentPasswordVerified] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const handleVerifyCurrentPassword = async () => {
    setPasswordError(null);
    setIsVerifyingPassword(true);
    try {
      await authService.verifyCurrentPassword({
        password: passwords.currentPassword,
      });
      setIsCurrentPasswordVerified(true);
      toast.success("ยืนยันรหัสผ่านเดิมสำเร็จ");
    } catch (error) {
      setIsCurrentPasswordVerified(false);
      setPasswordError(error?.message || "รหัสผ่านเดิมไม่ถูกต้อง");
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);

    if (!isCurrentPasswordVerified) {
      setPasswordError("กรุณากรอกรหัสผ่านเดิมและกดยืนยันก่อน");
      return;
    }

    if (passwords.password.length < 8) {
      const errMsg = "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร";
      setPasswordError(errMsg);
      return;
    }
    if (!/^[A-Za-z0-9]+$/.test(passwords.password)) {
      setPasswordError("รหัสผ่านใช้ได้เฉพาะตัวอักษรภาษาอังกฤษและตัวเลขเท่านั้น");
      return;
    }
    if (!/[A-Za-z]/.test(passwords.password)) {
      setPasswordError("รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษอย่างน้อย 1 ตัว");
      return;
    }
    if (!/\d/.test(passwords.password)) {
      setPasswordError("รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว");
      return;
    }
    if (passwords.password !== passwords.confirmPassword) {
      const errMsg = "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน";
      setPasswordError(errMsg);
      return;
    }

    setIsSavingPassword(true);
    try {
      await authService.updateAccount({ password: passwords.password });
      setPasswords({ currentPassword: "", password: "", confirmPassword: "" });
      setIsCurrentPasswordVerified(false);
      toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
    } catch (error) {
      console.error("Update password error:", error);
      const errMsg = error?.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้ในขณะนี้";
      setPasswordError(errMsg);
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">ตั้งค่าบัญชี</h1>
        <p className="text-slate-500 mt-1">
          รหัสผ่าน และการแจ้งเตือนของคุณ
        </p>
      </div>

      {/* Password */}
      <form
        onSubmit={handleSavePassword}
        noValidate
        className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-4"
      >
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-slate-400" /> รหัสผ่าน
        </h3>
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2">
            ยืนยันรหัสผ่านเดิม
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="password"
              value={passwords.currentPassword}
              disabled={isCurrentPasswordVerified}
              onChange={(e) => {
                setPasswords((prev) => ({
                  ...prev,
                  currentPassword: e.target.value,
                }));
                setIsCurrentPasswordVerified(false);
                if (passwordError) setPasswordError(null);
              }}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-800 font-medium disabled:bg-slate-100 disabled:text-slate-500"
              placeholder="กรอกรหัสผ่านเดิม"
            />
            <button
              type="button"
              onClick={handleVerifyCurrentPassword}
              disabled={
                isVerifyingPassword ||
                isCurrentPasswordVerified ||
                !passwords.currentPassword
              }
              className="px-6 py-3 rounded-xl font-bold text-white bg-slate-700 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
            >
              {isVerifyingPassword
                ? "กำลังตรวจสอบ..."
                : isCurrentPasswordVerified
                  ? "ยืนยันแล้ว"
                  : "ยืนยัน"}
            </button>
          </div>
          {isCurrentPasswordVerified && (
            <p className="text-xs text-emerald-600 font-medium mt-2">
              รหัสผ่านเดิมถูกต้อง
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              รหัสผ่านใหม่
            </label>
            <input
              type="password"
              disabled={!isCurrentPasswordVerified}
              value={passwords.password}
              minLength={8}
              pattern="[A-Za-z0-9]+"
              title="อย่างน้อย 8 ตัวอักษร โดยใช้ตัวอักษรภาษาอังกฤษและตัวเลข"
              onChange={(e) => {
                setPasswords((prev) => ({ ...prev, password: e.target.value }));
                if (passwordError) setPasswordError(null);
              }}
              className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none transition-all text-slate-800 font-medium disabled:bg-slate-100 disabled:cursor-not-allowed ${passwordError
                ? "border-red-500 focus:ring-4 focus:ring-red-500/10 focus:border-red-500"
                : "border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary"
                }`}
              placeholder="อย่างน้อย 8 ตัวอักษร"
            />
            <p className="text-xs text-slate-400 mt-2">
              ใช้ตัวอักษรภาษาอังกฤษและตัวเลข อย่างน้อยอย่างละ 1 ตัว
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              ยืนยันรหัสผ่านใหม่
            </label>
            <input
              type="password"
              disabled={!isCurrentPasswordVerified}
              value={passwords.confirmPassword}
              onChange={(e) => {
                setPasswords((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }));
                if (passwordError) setPasswordError(null);
              }}
              className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none transition-all text-slate-800 font-medium disabled:bg-slate-100 disabled:cursor-not-allowed ${passwordError
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
            !isCurrentPasswordVerified ||
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
