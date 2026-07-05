import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { reset_password } from "./Api/routes";

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            const res = await reset_password(token, { password });
            toast.success(res.data?.message || "Password reset successful");
            setIsSuccess(true);
            setTimeout(() => navigate("/login"), 3000);
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to reset password. The link might be expired.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-zinc-950 font-sans sm:flex-row">
            <div className="relative hidden w-full flex-col justify-between overflow-hidden border-r border-zinc-800 bg-zinc-900 p-12 md:flex md:w-1/2 lg:w-5/12">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-zinc-900 to-zinc-900"></div>
                <div className="relative z-10 flex flex-col gap-6">
                    <div className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300 backdrop-blur-md">
                        ProjectForge
                    </div>
                </div>
            </div>

            <div className="flex w-full flex-col bg-zinc-950 md:w-1/2 lg:w-7/12">
                <div className="flex-1 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-5 sm:p-8 md:p-10 lg:p-12">
                        <div className="w-full max-w-md">
                            <div className="mb-8 text-center md:text-left">
                                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                    Reset Password
                                </h2>
                                <p className="mt-3 text-sm leading-6 text-zinc-400">
                                    Enter your new password below.
                                </p>
                            </div>

                            {isSuccess ? (
                                <div className="text-center md:text-left">
                                    <p className="text-green-400 mb-6">
                                        Your password has been successfully reset! Redirecting you to login...
                                    </p>
                                    <Link 
                                        to="/login" 
                                        className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition-all hover:bg-zinc-200"
                                    >
                                        Go to Login Now
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-zinc-200">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Min. 6 characters"
                                            className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition duration-200 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700/40"
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-zinc-200">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm password"
                                            className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition duration-200 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700/40"
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="w-full rounded-2xl bg-white px-4 py-3.5 text-sm font-semibold text-zinc-900 shadow-sm transition-all hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Resetting..." : "Reset Password"}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
