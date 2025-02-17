import React, { useState, useContext } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText, CListGroup, CListGroupItem,
  CRow, CSpinner
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import { useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // ✅ Import icons from React Icons
import { AppContext } from 'src/App'
import {Back_Origin} from "../../../../../Frontend_ENV";

const Register = () => {
  const navigate = useNavigate()
  const { showMessage } = useContext(AppContext);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    gender: 'Male',
    role: 'user',
    password: '',
    confirmPassword: ''
  })
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    number: false,
    specialChar: false,
    match: false,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword1, setShowPassword1] = useState(false); // ✅ State for password visibility
  const [showPassword2, setShowPassword2] = useState(false); // ✅ State for password visibility

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name === 'password') {
      // Check password criteria
      setPasswordCriteria({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        number: /[0-9]/.test(value),
        specialChar: /[-@!$%^&*?]/.test(value),
      });
    } else if (name === 'confirmPassword') {
      // Check if password matches
      setPasswordCriteria(prev =>
        ({ ...prev, match: (value === formData.password) })
      );
    }
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true);
      let sentBody = { ...formData };
      delete sentBody.confirmPassword;
      sentBody.role = 'user';
      const response = await fetch(`${Back_Origin}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sentBody)
      })
      const data = await response.json()
      setLoading(false);
      if (data.error) {
        showMessage(data.error, true)
        return
      }
      showMessage(data.message, false);
      navigate('/login');
    } catch (error) {
      setLoading(false);
      showMessage('An error occurred. Please try again later.', true);
    }
  }

  const handleBackToLogin = () => {
    navigate('/login')
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={9} lg={7} xl={6}>
            <CCard className="mx-4">
              <CCardBody className="p-4">
                {
                  loading? (
                    <div className="d-flex justify-content-center align-items-center" style={{height: "552px"}}>
                      <CSpinner color="primary" style={{scale: '1.5'}}/>
                    </div>
                  ) : (
                    <CForm onSubmit={handleSubmit}>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h1 className="mb-0">Register</h1>
                        <CButton color="secondary" className="w-auto" onClick={handleBackToLogin}>
                          Back to Login
                        </CButton>
                      </div>

                      <p className="text-body-secondary">Create your account</p>

                      <div className="d-flex gap-2 register-input-group">
                        {/* Full Name Input */}
                        <CInputGroup className="mb-3">
                          <CInputGroupText>
                            <CIcon icon={cilUser} />
                          </CInputGroupText>
                          <CFormInput
                            name="name"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                          />
                        </CInputGroup>

                        {/* Gender Select */}
                        <CInputGroup className="mb-3">
                          <CInputGroupText style={{userSelect: "none"}}>Gender</CInputGroupText>
                          <CFormSelect
                            name="gender"
                            value={formData.gender}
                            onChange={handleInputChange}
                            style={{cursor: "pointer"}}
                          >
                            <option>Male</option>
                            <option>Female</option>
                          </CFormSelect>
                        </CInputGroup>
                      </div>

                      {/* Username Input */}
                      <CInputGroup className="mb-3">
                        <CInputGroupText>
                          <CIcon icon={cilUser} />
                        </CInputGroupText>
                        <CFormInput
                          name="username"
                          placeholder="Username"
                          value={formData.username}
                          onChange={handleInputChange}
                          required
                        />
                      </CInputGroup>

                      {/* Email Input */}
                      <CInputGroup className="mb-3">
                        <CInputGroupText>@</CInputGroupText>
                        <CFormInput
                          type="email"
                          name="email"
                          placeholder="Email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </CInputGroup>

                      <CListGroup className="mb-3" style={{paddingLeft: "30px"}}>
                        <CListGroupItem style={{display: "revert", border: "none", padding: "0 1rem"}}
                                        className={passwordCriteria.length ? 'text-success' : 'text-danger'}>
                          At least 8 characters
                        </CListGroupItem>
                        <CListGroupItem style={{display: "revert", border: "none", padding: "0 1rem"}}
                                        className={passwordCriteria.uppercase ? 'text-success' : 'text-danger'}>
                          At least one uppercase letter
                        </CListGroupItem>
                        <CListGroupItem style={{display: "revert", border: "none", padding: "0 1rem"}}
                                        className={passwordCriteria.number ? 'text-success' : 'text-danger'}>
                          At least one number
                        </CListGroupItem>
                        <CListGroupItem style={{display: "revert", border: "none", padding: "0 1rem"}}
                                        className={passwordCriteria.specialChar ? 'text-success' : 'text-danger'}>
                          At least one special character (-, @, $, !, %, *, ?, &)
                        </CListGroupItem>
                        <CListGroupItem style={{display: "revert", border: "none", padding: "0 1rem"}}
                                        className={passwordCriteria.match ? 'text-success' : 'text-danger'}>
                          Passwords match
                        </CListGroupItem>
                      </CListGroup>

                      {/* Password Input */}
                      <CInputGroup className="mb-3">
                        <CInputGroupText>
                          <CIcon icon={cilLockLocked} />
                        </CInputGroupText>
                        <CFormInput
                          type={showPassword1 ? 'text' : 'password'}
                          name="password"
                          placeholder="Password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                        />
                        <CInputGroupText onClick={() => setShowPassword1(!showPassword1)} style={{ cursor: 'pointer' }}>
                          {showPassword1 ? <FaEyeSlash /> : <FaEye />}
                        </CInputGroupText>
                      </CInputGroup>

                      {/* Confirm Password Input */}
                      <CInputGroup className="mb-4">
                        <CInputGroupText>
                          <CIcon icon={cilLockLocked} />
                        </CInputGroupText>
                        <CFormInput
                          type={showPassword2 ? 'text' : 'password'}
                          name="confirmPassword"
                          placeholder="Confirm Password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required
                        />
                        <CInputGroupText onClick={() => setShowPassword2(!showPassword2)} style={{ cursor: 'pointer' }}>
                          {showPassword2 ? <FaEyeSlash /> : <FaEye />}
                        </CInputGroupText>
                      </CInputGroup>

                      <div className="d-grid justify-content-center">
                        <CButton color="primary" type="submit">
                          Create Account
                        </CButton>
                      </div>
                    </CForm>
                  )
                }
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Register
