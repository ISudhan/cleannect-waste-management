import { Link } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo">
          🌱 Cleannect
        </Link>
        
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/waste">Browse Waste</Link>
          
          {user ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/create-listing">Post Waste</Link>
              <Link to="/profile">Profile</Link>
              <button 
                onClick={onLogout} 
                className="btn btn-secondary"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
