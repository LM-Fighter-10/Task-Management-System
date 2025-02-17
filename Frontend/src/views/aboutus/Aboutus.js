import React from 'react';
import { CButton, CCol, CRow } from '@coreui/react';
import { NavLink } from 'react-router-dom';
import { AppContext } from 'src/App';

const AboutUs = () => {
  const { currentUser } = React.useContext(AppContext);
return (
    <>
        <div className="container mx-auto py-16 px-4">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold mb-4">About Us</h1>
                <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                    We are a team of passionate developers dedicated to creating a
                    powerful and user-friendly task management solution.
                    Our goal is to empower individuals and teams to achieve their
                    full potential by providing a seamless and efficient platform
                    for managing tasks and projects.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                <div className="bg-gray-100 p-6 rounded-lg">
                    <h2 className="text-2xl font-semibold mb-4">Our Journey</h2>
                    <ul className="list-disc list-inside text-lg text-gray-700 space-y-2">
                        <li>This project started with a vision to create a user-friendly and efficient task management system.</li>
                        <li>Our team has worked tirelessly to bring this vision to life, focusing on delivering a high-quality product that meets the needs of our users.</li>
                        <li>Throughout the development process, we have faced numerous challenges, but our dedication and passion have driven us to overcome them.</li>
                        <li>We have continuously improved and refined our website, incorporating feedback from our users and staying up-to-date with the latest industry trends.</li>
                        <li>We are proud of what we have achieved so far and are committed to further enhancing our project.</li>
                        <li>Thank you for being a part of our journey, and we hope you find our task management system useful and enjoyable to use.</li>
                    </ul>
                </div>

                <div className="bg-gray-100 p-6 rounded-lg">
                    <h2 className="text-2xl font-semibold mb-4">Our Team</h2>
                    <ul className="list-disc list-inside text-lg text-gray-700 space-y-2">
                        <li>Our team consists of talented and dedicated professionals from various fields, including software development, design, and project management.</li>
                        <li>Each member brings a unique set of skills and experiences to the table, contributing to the overall success of our project.</li>
                        <li>We believe in fostering a collaborative and inclusive work environment where everyone's ideas are valued and respected.</li>
                        <li>This approach has allowed us to innovate and create a product that truly meets the needs of our users.</li>
                        <li>Integrity, innovation, and customer satisfaction are at the core of our values.</li>
                        <li>We strive to maintain the highest standards of quality and transparency in everything we do.</li>
                    </ul>
                </div>
            </div>

            <div className="mt-16 bg-gray-100 p-6 rounded-lg">
                <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
                <p className="text-lg text-gray-700 mb-4">
                    At the core of our company, we hold a set of values that guide our actions and decisions. These values are:
                </p>
                <ul className="list-disc list-inside text-lg text-gray-700 space-y-2">
                    <li><strong>Integrity:</strong> We believe in being honest and transparent in all our dealings.</li>
                    <li><strong>Innovation:</strong> We strive to continuously improve and innovate our solutions.</li>
                    <li><strong>Customer Focus:</strong> Our customers are at the heart of everything we do.</li>
                    <li><strong>Collaboration:</strong> We work together to achieve common goals and foster a supportive environment.</li>
                    <li><strong>Excellence:</strong> We are committed to delivering high-quality products and services.</li>
                </ul>
            </div>

            <div className="mt-16 bg-gray-100 p-6 rounded-lg">
                <h2 className="text-2xl font-semibold mb-4">Future Plans</h2>
                <ul className="list-disc list-inside text-lg text-gray-700 space-y-2">
                    <li>Looking ahead, we have ambitious plans to expand and enhance our task management system.</li>
                    <li>We are exploring new features and functionalities that will further improve the user experience and provide even more value to our users.</li>
                    <li>We are also committed to growing our community and fostering strong relationships with our users.</li>
                    <li>Your feedback and support are invaluable to us, and we look forward to continuing this journey together.</li>
                    <li>Thank you for taking the time to learn more about us. We are excited about the future and are grateful for your support.</li>
                </ul>
            </div>
        </div>
        <CRow className="text-center my-5">
            <CCol>
                <h2 className="text-2xl font-semibold mb-4">Ready to Get Started?</h2>
                <p className="text-lg text-gray-700 mb-4">
                    Join thousands of teams who are already using Task Pulse to streamline their workflow and achieve their goals. Get started today!
                </p>
                <div>
                    <CButton color="primary" className="me-3 px-4 py-2" as={NavLink} to={"/contact"}>Contact Us </CButton>
                  {
                    !currentUser &&
                      <CButton color="success" className="px-4 py-2" as={NavLink} to={"/register"}>Register</CButton>
                  }
                </div>
            </CCol>
        </CRow>
    </>
);
};

export default AboutUs;
