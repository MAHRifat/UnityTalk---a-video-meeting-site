import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const withAuth = (WrappedComponent) => {
    const AuthComponent = (props) => {
        const router = useNavigate();

        const isAuthenticated = !!localStorage.getItem("token");

        useEffect(() => {
            if (!isAuthenticated) {
                router("/auth");
            }
        }, [isAuthenticated, router]);

        return <WrappedComponent {...props} isAuthenticated={isAuthenticated} />;
    }

    return AuthComponent;
}

export default withAuth;