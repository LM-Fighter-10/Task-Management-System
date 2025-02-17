import React from 'react';
import { Link } from 'react-router-dom';
import { useState, useContext } from 'react';
import {AppContext} from "src/App";
import {jwtDecode} from "jwt-decode";
import {useNavigate} from "react-router-dom";
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // ✅ Import icons from React Icons
import { CSpinner } from '@coreui/react'
import {Back_Origin} from "../../../../../Frontend_ENV";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // ✅ State for loading spinner
  const [showPassword, setShowPassword] = useState(false); // ✅ State for password visibility
  const { setCurrentUser, showMessage } = useContext(AppContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); // ✅ Show loading spinner
    try {
      const response = await fetch(`${Back_Origin}/login`,{
        method: "POST",
        headers:{"Content-Type": "application/json"},
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      setLoading(false); // ✅ Hide loading spinner

      if (!data.error){
        localStorage.setItem("token", data.data); // save token to local storage
        setCurrentUser(jwtDecode(data.data)); // set current user
        showMessage(data.message, false); // show success message
        navigate("/"); // redirect to home page
      }else{
        showMessage(data.error, true); // show error message
        setCurrentUser(null);
      }
    } catch (error) {
      setLoading(false); // ✅ Hide loading spinner
      showMessage("Something went wrong. Please try again.", true); // show error message
      setCurrentUser(null);
    }
  };

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center justify-content-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={9} className="login-column">
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  {
                    loading? (
                      <div className="d-flex justify-content-center align-items-center h-100">
                        <CSpinner color="primary" style={{scale: '1.5'}}/>
                      </div>
                    ) : (
                      <CForm onSubmit={handleLogin}>
                        {/* Home Page Button and Login Title in the Same Line */}
                        <div className="d-flex justify-content-between align-items-center mb-3" style={{gap: "50px"}}>
                          <h1 className="mb-0">Login</h1>
                          <Link to="/">
                            <CButton color="secondary" className="p-2" style={{
                              fontSize: "14px"
                            }}>
                              Home Page
                            </CButton>
                          </Link>
                        </div>

                        <p className="text-body-secondary">Sign In to your account</p>

                        {/* Email Field */}
                        <CInputGroup className="mb-3">
                          <CInputGroupText>
                            <CIcon icon={cilUser} />
                          </CInputGroupText>
                          <CFormInput
                            type= "username"
                            placeholder="Username"
                            autoComplete="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                          />
                        </CInputGroup>

                        {/* Password Field with Show/Hide Toggle */}
                        <CInputGroup className="mb-4">
                          <CInputGroupText>
                            <CIcon icon={cilLockLocked} />
                          </CInputGroupText>
                          <CFormInput
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                          <CInputGroupText onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer' }}>
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                          </CInputGroupText>
                        </CInputGroup>

                        {/* Home and Login Button in the Same Row */}
                        <CRow className="justify-content-between flex-column g-2">
                          <CCol className="text-center">
                            <CButton color="primary" className="px-4" type="submit">
                              Login
                            </CButton>
                          </CCol>
                          <CCol className="text-center">
                            <Link to="/forgetpassword">
                              <CButton className="px-3"
                                       style={{
                                         background: "none",
                                         outline: "none",
                                         border: "none",
                                       }}>
                                Forgot password?
                              </CButton>
                            </Link>
                          </CCol>
                        </CRow>
                      </CForm>
                    )
                  }
                </CCardBody>
              </CCard>

              <CCard className="text-white bg-primary py-5" style={{ width: '100%' }}>
                <CCardBody className="text-center">
                  <div>
                    <h2>Sign up</h2>
                    <p>
                      Don't have an account? Sign up now to get access to all our features and stay updated with the latest news and updates.
                    </p>
                    <p>
                      Join our community and start managing your tasks efficiently today!
                    </p>
                    <Link to="/register">
                      <CButton color="primary" className="mt-3" active tabIndex={-1}>
                        Register Now!
                      </CButton>
                    </Link>
                  </div>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login
