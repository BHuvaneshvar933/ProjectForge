import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { login_user } from "./Api/routes";

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

    return (
        <div className="min-h-screen bg-zinc-950 px-4 py-10 text-white sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
                <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950 shadow-2xl md:grid-cols-2">
                    <div className="hidden min-h-full flex-col justify-between border-b border-zinc-800 bg-zinc-950 p-8 text-white md:flex md:border-b-0 md:border-r md:p-10 lg:p-12">
                        <div>
                            <div className="inline-flex items-center rounded-full border border-zinc-700 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-300">
                                ProjectForge
                            </div>

                            <h1 className="mt-8 max-w-sm text-3xl font-semibold leading-tight lg:text-4xl">
                                Welcome back to your workspace.
                            </h1>

                            <p className="mt-4 max-w-md text-sm leading-7 text-zinc-400 lg:text-base">
                                Sign in to manage projects, collaborate with your team, and
                                continue where you left off.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center p-5 sm:p-8 md:p-10 lg:p-12">
                        <form onSubmit={handleSubmit} className="w-full max-w-md" noValidate>
                            <div className="mb-8 text-center md:hidden">
                                <div className="inline-flex items-center rounded-full border border-zinc-700 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-300">
                                    TeamForge
                                </div>
                            </div>

                            <div className="mb-8 text-center md:text-left">
                                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                    Login
                                </h2>

                                <p className="mt-3 text-sm leading-6 text-zinc-400">
                                    Enter your credentials to access your account.
                                </p>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-2 block text-sm font-medium text-zinc-200"
                                    >
                                        Email
                                    </label>

                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        className={`w-full rounded-2xl border bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition duration-200 ${errors.email
                                                ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                                                : "border-zinc-700 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700/40"
                                            }`}
                                    />

                                    {errors.email && (
                                        <p className="mt-2 text-sm text-red-400">{errors.email}</p>
                                    )}
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <label
                                            htmlFor="password"
                                            className="block text-sm font-medium text-zinc-200"
                                        >
                                            Password
                                        </label>

                                        <button
                                            type="button"
                                            className="text-xs font-medium text-zinc-500 transition hover:text-zinc-300"
                                        >
                                            Forgot password?
                                        </button>
                                    </div>

                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter your password"
                                        className={`w-full rounded-2xl border bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition duration-200 ${errors.password
                                                ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                                                : "border-zinc-700 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700/40"
                                            }`}
                                    />

                                    {errors.password && (
                                        <p className="mt-2 text-sm text-red-400">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 space-y-4">
                                <button
                                    type="submit"
                                    className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition duration-200 hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-500/40"
                                >
                                    Login
                                </button>

                                <p className="text-center text-sm text-zinc-400">
                                    Need an account?{" "}
                                    <button
                                        type="button"
                                        onClick={() => navigate("/register")}
                                        className="font-medium text-zinc-200"
                                    >
                                        Register
                                    </button>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
