import { useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';

import Home from './pages/home';
import EventDetail from './pages/eventDetail';
import Login from './pages/login';
import Register from './pages/register';
import UserDashboard from './pages/userDashboard';
import AdminDashboard from './pages/adminDashboard';

function App() {
    const location = useLocation();
    const path = location.pathname;

    let page;

    if (path === '/') {
        page = <Home />;
    }
    else if (path.startsWith('/events/')) {
        page = <EventDetail />;
    }
    else if (path === '/login') {
        page = <Login />;
    }
    else if (path === '/register' || path === '/signup') {
        page = <Register />;
    }
    else if (path === '/dashboard') {
        page = <UserDashboard />;
    }
    else if (path === '/admin-dashboard') {
        page = <AdminDashboard />;
    }
    else {
        page = <Home />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            {page}
        </div>
    );
}

export default App;