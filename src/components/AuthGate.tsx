import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Fingerprint, ArrowRight, ShieldCheck, Key, Mail, Lock } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification, signOut, sendPasswordResetEmail, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../firebase';
import { seedUserRoutine } from '../db';
import { ZenithCanvasBackground } from './ZenithCanvasBackground';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [unverifiedUser, setUnverifiedUser] = useState<any>(null);
  
  const [resetMode, setResetMode] = useState(false);
  const [oobCode, setOobCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const code = params.get('oobCode');
    if (mode === 'resetPassword' && code) {
      setResetMode(true);
      setOobCode(code);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.emailVerified) {
          if (user.email) seedUserRoutine(user.email);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setErrorMsg('Please verify your email before logging in.');
          signOut(auth);
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (resetMode) {
      if (!newPassword.trim() || !oobCode) return;
      setIsSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');
      
      try {
        await confirmPasswordReset(auth, oobCode, newPassword);
        setSuccessMsg("Password successfully reset! You can now log in.");
        setTimeout(() => {
          setResetMode(false);
          setIsLogin(true);
          setSuccessMsg('');
          setNewPassword('');
          window.history.replaceState({}, document.title, window.location.pathname);
        }, 3000);
      } catch (error: any) {
        console.error("Confirm reset error:", error);
        setErrorMsg(error.message || 'Failed to reset password. Link may be expired.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    
    if (isForgotPassword) {
      if (!email.trim()) {
        setErrorMsg("Please enter your email address.");
        return;
      }
      setIsSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');
      try {
        const actionCodeSettings = {
          url: 'https://shaikhjubair.me/zenith/',
          handleCodeInApp: false,
        };
        await sendPasswordResetEmail(auth, email, actionCodeSettings);
        setSuccessMsg("Password reset email sent! Check your inbox.");
      } catch (error: any) {
        console.error("Forgot password error:", error);
        setErrorMsg(error.message || 'Failed to send password reset email.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!email.trim() || !password.trim()) return;
    
    if (email.trim().toLowerCase() !== 'shaikh.jubair.2025@gmail.com') {
      setErrorMsg('Access Denied: Unauthorized User.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    setUnverifiedUser(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        setUnverifiedUser(userCredential.user);
        await signOut(auth);
        setErrorMsg('Please verify your email before logging in.');
        setIsSubmitting(false);
        return;
      }
      // onAuthStateChanged will handle setting isAuthenticated to true for verified users
    } catch (error: any) {
      console.error("Auth error:", error);
      setErrorMsg(error.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedUser) return;
    try {
      await sendEmailVerification(unverifiedUser);
      setSuccessMsg('Verification email resent. Check your inbox.');
      setErrorMsg('');
      setUnverifiedUser(null);
    } catch (err: any) {
      console.error("Resend error:", err);
      setErrorMsg(err.message || 'Failed to resend verification email.');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-[9999]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-[9999] overflow-hidden selection:bg-primary/30 selection:text-primary-fixed">
      {/* The Living Canvas Engine */}
      <ZenithCanvasBackground />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative z-10 w-full max-w-[420px] mx-4"
      >
        <div className="bg-surface-container-high/40 backdrop-blur-[80px] border border-white/20 rounded-[40px] p-10 flex flex-col items-center shadow-[0_30px_100px_rgba(0,0,0,0.6),inset_1px_1px_0px_rgba(255,255,255,0.2)] overflow-hidden relative">
          
          {/* Subtle SVG Wireframe Texture Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-5 mix-blend-overlay" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L40 20L20 40L0 20L20 0ZM20 2L2 20L20 38L38 20L20 2Z' fill='%23ffffff' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px'
          }}></div>

          {/* Inner Card Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-primary/15 blur-[60px] rounded-full pointer-events-none z-0"></div>

          <div className="relative z-10 w-20 h-20 rounded-[24px] bg-gradient-to-br from-primary/30 to-surface/10 border border-primary/30 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(255,180,166,0.15),inset_1px_1px_0px_rgba(255,255,255,0.2)] backdrop-blur-md rotate-3">
            <Fingerprint className="w-10 h-10 text-primary -rotate-3" strokeWidth={1.5} />
          </div>

          <h1 className="text-[36px] font-bold text-on-surface mb-2 tracking-tight text-center leading-none">
            {resetMode ? 'Set New Password' : (isForgotPassword ? 'Reset Password' : 'Welcome Back')}
          </h1>
          <p className="text-[16px] text-on-surface-variant text-center mb-8">
            {resetMode ? 'Enter a strong password for your account.' : (isForgotPassword ? 'Enter your email to receive a reset link.' : 'Sign in to access Zenith.')}
          </p>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 relative z-20">
            {resetMode ? (
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-surface-container-lowest/80 border border-white/10 hover:border-primary/50 hover:bg-white/5 focus:bg-white/10 focus:border-primary focus:shadow-[0_0_30px_rgba(255,180,166,0.4),inset_0_0_20px_rgba(255,180,166,0.1)] focus:-translate-y-0.5 rounded-2xl pl-12 pr-4 py-4 text-[16px] text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none transition-all duration-500"
                  required
                />
              </div>
            ) : (
              <>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    placeholder="shaikh.jubair.2025@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-container-lowest/80 border border-white/10 hover:border-primary/50 hover:bg-white/5 focus:bg-white/10 focus:border-primary focus:shadow-[0_0_30px_rgba(255,180,166,0.4),inset_0_0_20px_rgba(255,180,166,0.1)] focus:-translate-y-0.5 rounded-2xl pl-12 pr-4 py-4 text-[16px] text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none transition-all duration-500"
                    required
                  />
                </div>
                
                {!isForgotPassword && (
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-surface-container-lowest/80 border border-white/10 hover:border-primary/50 hover:bg-white/5 focus:bg-white/10 focus:border-primary focus:shadow-[0_0_30px_rgba(255,180,166,0.4),inset_0_0_20px_rgba(255,180,166,0.1)] focus:-translate-y-0.5 rounded-2xl pl-12 pr-4 py-4 text-[16px] text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none transition-all duration-500"
                      required
                    />
                  </div>
                )}
              </>
            )}

            {isLogin && !isForgotPassword && (
              <div className="flex justify-end mt-1">
                <button 
                  type="button"
                  onClick={() => { setIsForgotPassword(true); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-sm font-semibold text-primary hover:text-primary-fixed transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <div className="h-6 mt-1 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {errorMsg && (
                  <motion.p 
                    key="error"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-medium text-error text-center"
                  >
                    {errorMsg}
                  </motion.p>
                )}
                {successMsg && (
                  <motion.p 
                    key="success"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-medium text-primary text-center"
                  >
                    {successMsg}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {unverifiedUser && (
              <button
                type="button"
                onClick={handleResendVerification}
                className="w-full py-2 mb-2 rounded-xl bg-surface-container border border-primary/30 text-primary font-bold text-[14px] hover:bg-primary/10 transition-colors"
              >
                Resend Verification Email
              </button>
            )}

            {!isForgotPassword && !resetMode ? (
                <div className="flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-on-primary rounded-2xl py-4 font-bold text-[16px] tracking-wide transition-all shadow-[0_0_40px_rgba(255,180,166,0.3)] hover:shadow-[0_0_60px_rgba(255,180,166,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 group/btn"
                  >
                    {isSubmitting ? (
                      <div className="w-6 h-6 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium py-2"
                  >
                    Forgot Password?
                  </button>
                </div>
            ) : isForgotPassword ? (
              <button 
                type="submit"
                disabled={isSubmitting || !email}
                className="w-full py-4 mt-2 rounded-2xl bg-primary text-on-primary font-bold text-[16px] tracking-wide shadow-[0_0_20px_rgba(255,180,166,0.3)] hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(255,180,166,0.6)] hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:hover:-translate-y-0 disabled:hover:shadow-[0_0_20px_rgba(255,180,166,0.3)] disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Send Reset Link <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            ) : (
              <button 
                type="submit"
                disabled={isSubmitting || !newPassword}
                className="w-full py-4 mt-2 rounded-2xl bg-primary text-on-primary font-bold text-[16px] tracking-wide shadow-[0_0_20px_rgba(255,180,166,0.3)] hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(255,180,166,0.6)] hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:hover:-translate-y-0 disabled:hover:shadow-[0_0_20px_rgba(255,180,166,0.3)] disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Confirm Password <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </form>

          <div className="w-full mt-6 pt-6 border-t border-white/10 flex justify-center">
            {resetMode ? (
              <button 
                type="button"
                onClick={() => {
                  setResetMode(false);
                  setIsLogin(true);
                  setErrorMsg('');
                  setSuccessMsg('');
                  window.history.replaceState({}, document.title, window.location.pathname);
                }}
                className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors py-2 px-4 rounded-full hover:bg-primary/10"
              >
                Cancel Reset
              </button>
            ) : isForgotPassword ? (
              <button 
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors py-2 px-4 rounded-full hover:bg-primary/10"
              >
                Back to Login
              </button>
            ) : (
              <p className="mt-4 text-center text-sm text-on-surface-variant/60 font-medium">
                Zenith OS - Private Access Only
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
