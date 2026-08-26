import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { login_user, google_login } from "./Api/routes";
import { GoogleLogin } from '@react-oauth/google';
import logo from '../../assets/logo/logo.jpg';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!emailPattern.test(formData.email)) {
            newErrors.email = "Enter a valid email address";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 4) {
            newErrors.password = "Password must be at least 6 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((prev) => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (validate()) {
            try {
                const res = await login_user({
                    email: formData.email,
                    password: formData.password,
                });

                const token = res?.data?.data?.token;
                const user = res?.data?.data?.user;

                if (!token) {
                    toast.error("Login failed: missing token");
                    return;
                }

                window.localStorage.setItem("token", token);
                if (user?._id) {
                    window.localStorage.setItem("userId", user._id);
                }

                toast.success("Logged in");
                const redirectTo = location.state?.from || "/projects";
                navigate(redirectTo);
            } catch (err) {
                toast.error(err?.response?.data?.message || "Login failed");
            }
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await google_login({ token: credentialResponse.credential });
            const token = res?.data?.data?.token;
            const user = res?.data?.data?.user;

            if (!token) {
                toast.error("Google login failed: missing token");
                return;
            }

            window.localStorage.setItem("token", token);
            if (user?._id) {
                window.localStorage.setItem("userId", user._id);
            }

            toast.success("Logged in with Google");
            const redirectTo = location.state?.from || "/projects";
            navigate(redirectTo);
        } catch (err) {
            toast.error(err?.response?.data?.message || "Google login failed");
        }
    };

    return (
        <div className="relative min-h-screen bg-black px-4 py-8 text-white sm:px-6 lg:px-8 flex flex-col items-center justify-center">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
                <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-zinc-800 bg-[#09090B] shadow-2xl md:grid-cols-2">
                    <div className="hidden min-h-full flex-col items-center justify-center border-b border-zinc-800 bg-black p-10 md:flex md:border-b-0 md:border-r md:p-12">
                        <img src={logo} alt="ProjectForge Logo" className="h-56 max-h-[260px] w-auto object-contain rounded-2xl shadow-2xl" />
                    </div>

                    <div className="flex items-center justify-center p-6 sm:p-8 md:p-10 lg:p-12 bg-[#09090B]">
                        <form onSubmit={handleSubmit} className="w-full max-w-md" noValidate>
                            <div className="mb-8 text-center md:hidden flex justify-center">
                                <img src={logo} alt="Logo" className="h-28 w-auto object-contain rounded-xl" />
                            </div>

                            <div className="mb-8 text-center md:text-left">
                                <h2 className="text-3xl font-extrabold tracking-tight text-[#F9F8F5]" style={{ color: '#F9F8F5' }}>
                                    Sign In
                                </h2>

                                <p className="mt-2 text-sm text-[#F9F8F5]" style={{ color: '#F9F8F5' }}>
                                    Enter your credentials to access your account.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-1.5 block text-sm font-semibold text-[#F9F8F5]"
                                        style={{ color: '#F9F8F5' }}
                                    >
                                        Email Address
                                    </label>

                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        className={`w-full rounded-lg border bg-zinc-900 px-4 py-3 text-sm text-[#F9F8F5] placeholder:text-zinc-500 outline-none transition duration-200 ${errors.email
                                                ? "border-red-500 focus:border-red-500"
                                                : "border-zinc-800 focus:border-[#F9F8F5]"
                                            }`}
                                    />

                                    {errors.email && (
                                        <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>
                                    )}
                                </div>

                                <div>
                                    <div className="mb-1.5 flex items-center justify-between gap-3">
                                        <label
                                            htmlFor="password"
                                            className="block text-sm font-semibold text-[#F9F8F5]"
                                            style={{ color: '#F9F8F5' }}
                                        >
                                            Password
                                        </label>

                                        <Link
                                            to="/forgot-password"
                                            className="text-xs font-semibold text-[#F9F8F5] underline transition hover:text-zinc-300"
                                            style={{ color: '#F9F8F5' }}
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>

                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter your password"
                                        className={`w-full rounded-lg border bg-zinc-900 px-4 py-3 text-sm text-[#F9F8F5] placeholder:text-zinc-500 outline-none transition duration-200 ${errors.password
                                                ? "border-red-500 focus:border-red-500"
                                                : "border-zinc-800 focus:border-[#F9F8F5]"
                                            }`}
                                    />

                                    {errors.password && (
                                        <p className="mt-1.5 text-xs text-red-400">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 space-y-4">
                                <button
                                    type="submit"
                                    className="w-full rounded-lg bg-white border border-white px-4 py-3 text-sm font-semibold text-black transition duration-200 hover:bg-zinc-200"
                                >
                                    Sign In
                                </button>

                                <p className="text-center text-sm text-[#F9F8F5]" style={{ color: '#F9F8F5' }}>
                                    Need an account?{" "}
                                    <button
                                        type="button"
                                        onClick={() => navigate("/register")}
                                        className="font-bold text-[#F9F8F5] underline"
                                        style={{ color: '#F9F8F5' }}
                                    >
                                        Register
                                    </button>
                                </p>

                                <div className="relative flex items-center justify-center text-xs mt-6 mb-4">
                                    <span className="absolute bg-[#09090B] px-3 text-[#F9F8F5] font-medium">Or continue with</span>
                                    <div className="w-full border-t border-zinc-800"></div>
                                </div>
                                <div className="flex justify-center mt-4">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => toast.error("Google login failed")}
                                        shape="rectangular"
                                        theme="filled_black"
                                    />
                                </div>
                            </div>
                        </form>

                    </div>
                </div>
            </div>

            <footer className="absolute bottom-3 left-0 right-0 text-center pointer-events-none">
                <span className="font-['Jost'] text-sm font-normal tracking-[0.02em] text-[#F9F8F5] uppercase" style={{ color: '#F9F8F5' }}>
                    PROJECTFORGE
                </span>
            </footer>
        </div>
    );
}

