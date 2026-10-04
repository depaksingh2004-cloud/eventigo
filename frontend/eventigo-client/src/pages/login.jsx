import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/authcontext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, verifyOTP } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError('');

        try {
            if (showOTP) {
                const data = await verifyOTP(email, otp);

                // OTP verified successfully
                window.location.href =
                    data?.role === 'admin'
                        ? '/admin-dashboard'
                        : '/dashboard';

            } else {
                const data = await login(email, password);

                // Login successful
                window.location.href =
                    data?.role === 'admin'
                        ? '/admin-dashboard'
                        : '/dashboard';
            }

        } catch (err) {
            console.error('Login error:', err);

            const errorData = err.response?.data;

            if (errorData?.needsverification) {
                setShowOTP(true);

                setError(
                    errorData.error ||
                    'Account not verified. A new OTP has been sent to your email.'
                );
            } else {
                setError(
                    errorData?.error ||
                    err.message ||
                    'Login failed'
                );
            }

        } finally {
            // Loading will always stop after login/OTP request
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-xl shadow-lg border border-gray-100">

            <h1 className="text-2xl font-bold mb-6">
                Login
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4">

                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                    className="w-full border p-2 rounded"
                />

                {!showOTP && (
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        className="w-full border p-2 rounded"
                    />
                )}

                {showOTP && (
                    <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter OTP"
                        required
                        className="w-full border p-2 rounded"
                    />
                )}

                {error && (
                    <p className="text-red-600">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white p-2 rounded"
                >
                    {loading
                        ? 'Please wait...'
                        : showOTP
                            ? 'Verify OTP'
                            : 'Login'}
                </button>

            </form>

            <p className="mt-4">
                Don't have an account?{' '}
                <a
                    href="/register"
                    className="text-blue-600"
                >
                    Register
                </a>
            </p>

        </div>
    );
};

export default Login;