import { useState } from "react";

export default function Register() {
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

    const handleSubmit = (event) => {
        event.preventDefault();

        if (validate()) {
            alert("Registration submitted successfully");
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 px-4 py-10 text-white sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
                <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950 shadow-2xl md:grid-cols-2">
                    <div className="hidden min-h-full flex-col justify-between border-b border-zinc-800 bg-zinc-950 p-8 text-white md:flex md:border-b-0 md:border-r md:p-10 lg:p-12">
                        <div>
                            <div className="inline-flex items-center rounded-full border border-zinc-700 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-300">
                                TeamForge
                            </div>

                            <h1 className="mt-8 max-w-sm text-3xl font-semibold leading-tight lg:text-4xl">
                                Build your account and start collaborating.
                            </h1>

                            <p className="mt-4 max-w-md text-sm leading-7 text-zinc-400 lg:text-base">
                                Create your account to organize projects, invite teammates,
                                and keep your workflow in one place.
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
                                    Register
                                </h2>

                                <p className="mt-3 text-sm leading-6 text-zinc-400">
                                    Fill in your details to create a new account.
                                </p>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label
                                        htmlFor="fullName"
                                        className="mb-2 block text-sm font-medium text-zinc-200"
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
                                        className={`w-full rounded-2xl border bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition duration-200 ${
                                            errors.fullName
                                                ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                                                : "border-zinc-700 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700/40"
                                        }`}
                                    />

                                    {errors.fullName && (
                                        <p className="mt-2 text-sm text-red-400">
                                            {errors.fullName}
                                        </p>
                                    )}
                                </div>

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
                                        className={`w-full rounded-2xl border bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition duration-200 ${
                                            errors.email
                                                ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                                                : "border-zinc-700 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700/40"
                                        }`}
                                    />

                                    {errors.email && (
                                        <p className="mt-2 text-sm text-red-400">{errors.email}</p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="password"
                                        className="mb-2 block text-sm font-medium text-zinc-200"
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
                                        className={`w-full rounded-2xl border bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition duration-200 ${
                                            errors.password
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

                                <div>
                                    <label
                                        htmlFor="confirmPassword"
                                        className="mb-2 block text-sm font-medium text-zinc-200"
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
                                        className={`w-full rounded-2xl border bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition duration-200 ${
                                            errors.confirmPassword
                                                ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                                                : "border-zinc-700 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700/40"
                                        }`}
                                    />

                                    {errors.confirmPassword && (
                                        <p className="mt-2 text-sm text-red-400">
                                            {errors.confirmPassword}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 space-y-4">
                                <button
                                    type="submit"
                                    className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition duration-200 hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-500/40"
                                >
                                    Create Account
                                </button>

                                <p className="text-center text-sm text-zinc-400">
                                    Already have an account?{" "}
                                    <span className="font-medium text-zinc-200">Login</span>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}




