import React, { useState, useContext } from 'react';
import './Contactus.css'; // Import the CSS file
import { AppContext } from 'src/App';
import {CSpinner} from "@coreui/react"; // Import the AppContext
import {Back_Origin} from "../../../../Frontend_ENV";

const ContactForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const {showMessage} = useContext(AppContext);

  const handleChange = (e) => {
    const {name, value} = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name === '' || formData.email === '' || formData.message === '') {
      showMessage('Please fill out all fields.', true);
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <div className="form-group">
        <label htmlFor="name">Name:</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="message">Message:</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          style={{minHeight: '100px', maxHeight: '300px'}}
        />
      </div>
      <button type="submit" className="submit-button">Submit</button>
    </form>
  );
};

const ContactInfo = () => (
    <div className="contact-info">
        <p>If you have any questions, feel free to reach out to us using the form above. We are here to help you with any inquiries you may have.</p>
        <p>You can also contact us directly at <a href="mailto:noreplyojo@gmail.com">noreplyojo@gmail.com</a>.</p>
    </div>
);

const ContactUs = () => {
  const { showMessage } = useContext(AppContext);
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (formData) => {
    // Handle form submission logic here
    try {
      setLoading(true);
      let sentData = {...formData};
      sentData.theme = localStorage.getItem('coreui-free-react-admin-template-theme');
      const response = await fetch(`${Back_Origin}/contactUs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sentData)
      });
      const data = await response.json();
      setLoading(false);
      if (data.error) {
        showMessage(data.error, true);
      } else {
        showMessage(data.message, false);
      }
    } catch (error) {
      setLoading(false);
      showMessage('An error occurred. Please try again.', true);
    }
  };

  return (
    <div className="contact-us">
      <h2>Contact Us</h2>
      {
        loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{height: "367px"}}>
            <CSpinner color="primary" style={{scale: '1.5'}}/>
          </div>
        ) : (
          <ContactForm onSubmit={handleFormSubmit}/>
        )
      }
      <ContactInfo/>
    </div>
  );
};

export default ContactUs;
