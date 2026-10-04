import { useState, useContext } from 'react';
import { AuthContext } from '../context/authcontext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setemail] = useState('');
  const [password, setpassword] = useState('');
  const [OTP, setOpt] = useState('');
  const [showOTP, setshowOTP] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, verifyOTP } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      if (!showOTP) {
        await register(name, email, password);
        setshowOTP(true);
      } else {
        await verifyOTP(email, OTP);
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error('Registration error:', err);

      setError(
        err.response?.data?.error ||
        err.message ||
        'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-xl shadow-lg border">

      <h1 className="text-2xl font-bold text-center mb-6">
        {showOTP ? 'Verify your email' : 'Create an account'}
      </h1>

      {error && (
        <p className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {!showOTP && (
          <>
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded border p-3"
            />

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setemail(e.target.value)}
              required
              className="w-full rounded border p-3"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setpassword(e.target.value)}
              required
              className="w-full rounded border p-3"
            />
          </>
        )}

        {showOTP && (
          <input
            type="text"
            placeholder="Enter OTP"
            value={OTP}
            onChange={(e) => setOpt(e.target.value)}
            required
            className="w-full rounded border p-3"
          />
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading
            ? 'Please wait...'
            : showOTP
              ? 'Verify OTP'
              : 'Register'}
        </button>

        {!showOTP && (
          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}

            <button
              type="button"
              onClick={() => {
                window.location.href = '/login';
              }}
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Log in
            </button>
          </p>
        )}

      </form>
    </div>
  );
};

export default Register;