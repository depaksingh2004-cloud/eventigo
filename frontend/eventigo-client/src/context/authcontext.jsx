import React from "react";
import api from "../utils/axios";

export const AuthContext = React.createContext();

export const AuthProvider = ({ children }) => {
    const [user, setuser] = React.useState(null);
    const [loading, setloading] = React.useState(true);

    // =========================
    // RESTORE USER FROM STORAGE
    // =========================
    React.useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");

        console.log("STORED USER:", storedUser);
        console.log("STORED TOKEN:", storedToken);

        if (storedUser && storedToken) {
            try {
                const parsedUser = JSON.parse(storedUser);

                console.log("RESTORED USER:", parsedUser);
                console.log("RESTORED ROLE:", parsedUser?.role);

                setuser(parsedUser);
            } catch (error) {
                console.error("Invalid stored user:", error);

                localStorage.removeItem("user");
                localStorage.removeItem("token");
            }
        } else {
            // If either user or token is missing,
            // clear both to avoid inconsistent auth state.
            localStorage.removeItem("user");
            localStorage.removeItem("token");
        }

        setloading(false);
    }, []);

    // =========================
    // LOGIN
    // =========================
    const login = async (email, password) => {
        try {
            const { data } = await api.post("/auth/login", {
                email,
                password,
            });

            console.log("LOGIN RESPONSE:", data);

            /*
                Backend currently returns:

                {
                    message,
                    _id,
                    name,
                    role,
                    token
                }

                But this also supports:

                {
                    user: {
                        _id,
                        name,
                        role
                    },
                    token
                }
            */

            const loggedInUser = data?.user || {
                _id: data?._id,
                name: data?.name,
                email: data?.email,
                role: data?.role,
            };

            const token = data?.token;

            console.log("LOGGED IN USER:", loggedInUser);
            console.log("LOGGED IN ROLE:", loggedInUser?.role);

            // Make sure we actually received user + token
            if (!loggedInUser || !loggedInUser.role) {
                throw new Error("Invalid login response: user role missing");
            }

            if (!token) {
                throw new Error("Invalid login response: token missing");
            }

            // Update React state
            setuser(loggedInUser);

            // Save user
            localStorage.setItem(
                "user",
                JSON.stringify(loggedInUser)
            );

            // Save token
            localStorage.setItem("token", token);

            console.log(
                "USER SAVED:",
                JSON.parse(localStorage.getItem("user"))
            );

            console.log(
                "ROLE SAVED:",
                JSON.parse(localStorage.getItem("user"))?.role
            );

            return {
                ...data,
                ...loggedInUser,
                token,
                role: loggedInUser.role,
            };
        } catch (err) {
            console.error("Login failed:", err);
            throw err;
        }
    };

    // =========================
    // REGISTER
    // =========================
    const register = async (name, email, password) => {
        try {
            const { data } = await api.post("/auth/register", {
                name,
                email,
                password,
            });

            return data;
        } catch (err) {
            console.error("Registration failed:", err);
            throw err;
        }
    };

    // =========================
    // VERIFY OTP
    // =========================
    const verifyOTP = async (email, otp) => {
        try {
            const { data } = await api.post("/auth/verify-otp", {
                email,
                otp,
            });

            console.log("OTP RESPONSE:", data);

            const verifiedUser = data?.user || {
                _id: data?._id,
                name: data?.name,
                email: data?.email,
                role: data?.role,
            };

            const token = data?.token;

            console.log("VERIFIED USER:", verifiedUser);
            console.log("VERIFIED ROLE:", verifiedUser?.role);

            if (!verifiedUser || !verifiedUser.role) {
                throw new Error(
                    "Invalid OTP response: user role missing"
                );
            }

            if (!token) {
                throw new Error(
                    "Invalid OTP response: token missing"
                );
            }

            setuser(verifiedUser);

            localStorage.setItem(
                "user",
                JSON.stringify(verifiedUser)
            );

            localStorage.setItem("token", token);

            return {
                ...data,
                ...verifiedUser,
                token,
                role: verifiedUser.role,
            };
        } catch (err) {
            console.error("OTP verification failed:", err);
            throw err;
        }
    };

    // =========================
    // LOGOUT
    // =========================
    const logout = () => {
        console.log("LOGOUT");

        setuser(null);

        localStorage.removeItem("user");
        localStorage.removeItem("token");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                verifyOTP,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};