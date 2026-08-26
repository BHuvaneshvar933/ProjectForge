import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { register_user, google_login } from "./Api/routes";
import { GoogleLogin } from '@react-oauth/google';
import logo from '../../assets/logo/logo.jpg';

export default function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formData.fullName.trim()) {
            newErrors.fullName = "Full name is required";
        }

        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!emailPattern.test(formData.email)) {
            newErrors.email = "Enter a valid email address";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
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
                const res = await register_user({
                    name: formData.fullName.trim(),
                    email: formData.email,
                    password: formData.password,
                });

                const token = res?.data?.data?.token;
                const user = res?.data?.data?.user;

                if (!token) {
                    toast.error("Registration failed: missing token");
                    return;
                }

                window.localStorage.setItem("token", token);
                if (user?._id) {
                    window.localStorage.setItem("userId", user._id);
                }

                toast.success("Account created");
                navigate("/projects");
            } catch (err) {
                toast.error(err?.response?.data?.message || "Registration failed");
            }
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await google_login({ token: credentialResponse.credential });
            const token = res?.data?.data?.token;
            const user = res?.data?.data?.user;

            if (!token) {
                toast.error("Google registration failed: missing token");
                return;
            }

            window.localStorage.setItem("token", token);
            if (user?._id) {
                window.localStorage.setItem("userId", user._id);
            }

            toast.success("Account created via Google");
            navigate("/projects");
        } catch (err) {
            toast.error(err?.response?.data?.message || "Google registration failed");
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

                            <div className="mb-6 text-center md:text-left">
                                <h2 className="text-3xl font-extrabold tracking-tight text-[#F9F8F5]" style={{ color: '#F9F8F5' }}>
                                     Create Account
                                </h2>

                                <p className="mt-1.5 text-sm text-[#F9F8F5]" style={{ color: '#F9F8F5' }}>
                                     Fill in your details to get started on ProjectForge.
                                 </p>
                            </div>

                            <div className="space-y-3.5">
                                <div>
                                    <label
                                        htmlFor="fullName"
                                        className="mb-1 block text-sm font-semibold text-[#F9F8F5]"
                                        style={{ color: '#F9F8F5' }}
                                    >
                                        Full Name
                                    </label>

                                    <input
                                        id="fullName"
                                        name="fullName"
                                        type="text"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        className={`w-full rounded-lg border bg-zinc-900 px-3.5 py-2.5 text-sm text-[#F9F8F5] placeholder:text-zinc-500 outline-none transition duration-200 ${errors.fullName
                                                ? "border-red-500 focus:border-red-500"
                                                : "border-zinc-800 focus:border-[#F9F8F5]"
                                            }`}
                                    />

                                    {errors.fullName && (
                                        <p className="mt-1 text-xs text-red-400">
                                            {errors.fullName}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-1 block text-sm font-semibold text-[#F9F8F5]"
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
                                        className={`w-full rounded-lg border bg-zinc-900 px-3.5 py-2.5 text-sm text-[#F9F8F5] placeholder:text-zinc-500 outline-none transition duration-200 ${errors.email
                                                ? "border-red-500 focus:border-red-500"
                                                : "border-zinc-800 focus:border-[#F9F8F5]"
                                            }`}
                                    />

                                    {errors.email && (
                                        <p className="mt-1 text-xs text-red-400">{errors.email}</p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="password"
                                        className="mb-1 block text-sm font-semibold text-[#F9F8F5]"
                                        style={{ color: '#F9F8F5' }}
                                    >
                                        Password
                                    </label>

                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Create a password"
                                        className={`w-full rounded-lg border bg-zinc-900 px-3.5 py-2.5 text-sm text-[#F9F8F5] placeholder:text-zinc-500 outline-none transition duration-200 ${errors.password
                                                ? "border-red-500 focus:border-red-500"
                                                : "border-zinc-800 focus:border-[#F9F8F5]"
                                            }`}
                                    />

                                    {errors.password && (
                                        <p className="mt-1 text-xs text-red-400">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="confirmPassword"
                                        className="mb-1 block text-sm font-semibold text-[#F9F8F5]"
                                        style={{ color: '#F9F8F5' }}
                                    >
                                        Confirm Password
                                    </label>

                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Re-enter your password"
                                        className={`w-full rounded-lg border bg-zinc-900 px-3.5 py-2.5 text-sm text-[#F9F8F5] placeholder:text-zinc-500 outline-none transition duration-200 ${errors.confirmPassword
                                                ? "border-red-500 focus:border-red-500"
                                                : "border-zinc-800 focus:border-[#F9F8F5]"
                                            }`}
                                    />

                                    {errors.confirmPassword && (
                                        <p className="mt-1 text-xs text-red-400">
                                            {errors.confirmPassword}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-5 space-y-3">
                                <button
                                    type="submit"
                                    className="w-full rounded-lg bg-white border border-white px-4 py-3 text-sm font-semibold text-black transition duration-200 hover:bg-zinc-200"
                                >
                                    Create Account
                                </button>

                                <p className="text-center text-sm text-[#F9F8F5]" style={{ color: '#F9F8F5' }}>
                                    Already have an account?{" "}
                                    <button
                                        type="button"
                                        onClick={() => navigate("/login")}
                                        className="font-bold text-[#F9F8F5] underline"
                                        style={{ color: '#F9F8F5' }}
                                    >
                                        Sign In
                                    </button>
                                </p>

                                <div className="relative flex items-center justify-center text-xs mt-4 mb-3">
                                    <span className="absolute bg-[#09090B] px-3 text-[#F9F8F5] font-medium">Or continue with</span>
                                    <div className="w-full border-t border-zinc-800"></div>
                                </div>
                                <div className="flex justify-center mt-3">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => toast.error("Google registration failed")}
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
