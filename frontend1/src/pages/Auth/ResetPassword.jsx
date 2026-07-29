import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { reset_password } from "./Api/routes";
import logo from '../../assets/logo/logo.jpg';

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
        <div className="relative min-h-screen bg-black px-4 py-8 text-white sm:px-6 lg:px-8 flex flex-col items-center justify-center">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
                <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-zinc-800 bg-black shadow-2xl md:grid-cols-2">
                    <div className="hidden min-h-full flex-col items-center justify-center border-b border-zinc-800 bg-black p-8 text-white md:flex md:border-b-0 md:border-r md:p-10 lg:p-12">
                        <div className="flex flex-col items-center justify-center text-center w-full">
                            <img 
                                src={logo} 
                                alt="Logo" 
                                className="w-80 max-w-full h-auto object-contain rounded-2xl shadow-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-center p-5 sm:p-8 md:p-10 lg:p-12">
                        <div className="w-full max-w-md">
                            <div className="mb-8 text-center md:hidden flex justify-center">
                                <img src={logo} alt="Logo" className="h-24 w-auto object-contain rounded-xl" />
                            </div>

                            <div className="mb-8 text-center md:text-left">
                                <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                                    Reset Password
                                </h2>
                                <p className="mt-3 text-base leading-6 text-zinc-300">
                                    Enter your new password below.
                                </p>
                            </div>

                            {isSuccess ? (
                                <div className="text-center md:text-left space-y-6">
                                    <p className="text-green-400 text-base">
                                        Your password has been successfully reset! Redirecting you to login...
                                    </p>
                                    <Link 
                                        to="/login" 
                                        className="inline-flex w-full items-center justify-center rounded-md bg-white border border-white px-4 py-3.5 text-base font-semibold text-black transition duration-200 hover:bg-black hover:text-white hover:border-white"
                                    >
                                        Go to Login Now
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                                    <div>
                                        <label className="mb-2 block text-base font-medium text-zinc-200">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Min. 6 characters"
                                            className="w-full rounded-md border border-zinc-800 bg-black px-4 py-3.5 text-base text-white placeholder:text-zinc-400 outline-none transition duration-200 focus:border-[#ffffff] focus:ring-1 focus:ring-[#ffffff]"
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-base font-medium text-zinc-200">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm password"
                                            className="w-full rounded-md border border-zinc-800 bg-black px-4 py-3.5 text-base text-white placeholder:text-zinc-400 outline-none transition duration-200 focus:border-[#ffffff] focus:ring-1 focus:ring-[#ffffff]"
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="w-full rounded-md bg-white border border-white px-4 py-3.5 text-base font-semibold text-black transition duration-200 hover:bg-black hover:text-white hover:border-white focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-70"
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

            <footer className="absolute bottom-3 left-0 right-0 text-center pointer-events-none">
                <span className="font-['Jost'] text-sm font-medium tracking-[0.1em] text-zinc-300 uppercase">
                    PROJECTFORGE
                </span>
            </footer>
        </div>
    );
}
