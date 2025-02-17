import React from 'react';
import { Link } from 'react-router-dom';
import './page404.css'; // Ensure you have this CSS file

const Page404 = () => {
    return (
        <div className="page-404">
            <h1>404</h1>
            <p>Oops! The page you're looking for doesn't exist.</p>
            <Link to="/" className="home-link">Go Back Home</Link>
        </div>
    );
};

export default Page404;