import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { forgot_password } from "./Api/routes";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (!email) {
            toast.error("Please enter your email address");
            return;
        }

        setIsLoading(true);
        try {
            const res = await forgot_password({ email });
            toast.success(res.data?.message || "Reset link sent!");
            setIsSent(true);
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to send reset link");
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
                                    Forgot Password
                                </h2>
                                <p className="mt-3 text-sm leading-6 text-zinc-400">
                                    Enter your email and we'll send you a reset link.
                                </p>
                            </div>

                            {isSent ? (
                                <div className="text-center md:text-left">
                                    <p className="text-zinc-300 mb-6">
                                        If an account exists with <span className="font-semibold text-white">{email}</span>, we have sent a password reset link. Please check your inbox (and spam folder).
                                    </p>
                                    <Link 
                                        to="/login" 
                                        className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition-all hover:bg-zinc-200"
                                    >
                                        Back to Login
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                                    <div>
                                        <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-200">
                                            Email Address
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition duration-200 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700/40"
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="w-full rounded-2xl bg-white px-4 py-3.5 text-sm font-semibold text-zinc-900 shadow-sm transition-all hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Sending..." : "Send Reset Link"}
                                    </button>
                                </form>
                            )}

                            {!isSent && (
                                <p className="mt-8 text-center text-sm text-zinc-400 md:text-left">
                                    Remember your password?{" "}
                                    <Link to="/login" className="font-medium text-white hover:underline">
                                        Log in
                                    </Link>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
