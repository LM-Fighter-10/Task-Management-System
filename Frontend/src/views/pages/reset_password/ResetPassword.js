import React, { useEffect, useState, useContext } from 'react';
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CRow,
  CInputGroup,
  CInputGroupText,
  CSpinner,
  CListGroup,
  CListGroupItem
} from '@coreui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { AppContext } from "src/App";
import {Back_Origin} from "../../../../../Frontend_ENV";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const { showMessage } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  // const [showOldPassword, setShowOldPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] =
    useState({ password: "", confirmPassword: "" });
  // const [oldPassError, setOldPassError] = useState("");
  const [pass1Error, setPass1Error] = useState("");
  const [pass2Error, setPass2Error] = useState("");
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });

  useEffect(() => {
    if (!token || token === "undefined" || token === "null") {
      showMessage("Invalid reset password link.", true);
      navigate('/login');
    } else {
      const checkToken = async () => {
        try {
          const response = await fetch(`${Back_Origin}/verifyRestToken/${token}`, {
            method: "POST"
          });
          const data = await response.json();
          if (data.error) {
            showMessage(data.error, true);
            navigate('/login');
          } else {
            setLoading(false);
          }
        } catch (error) {
          showMessage("Something went wrong. Please try again.", true);
          navigate('/login');
        }
      }
      const Interval = setInterval(() => {checkToken()}, 1000);
      return () => {
        clearInterval(Interval);
      }
    }
  }, [token]);

  const validatePassword = (password) => {
    setPasswordCriteria({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      specialChar: /[@$!%*?&-]/.test(password),
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "password") {
      validatePassword(value);
      if (value.length < 8 && value.length > 0) {
        setPass1Error("Password must be at least 8 characters");
      } else {
        setPass1Error("");
      }
    } else if (name === "confirmPassword") {
      if (formData.password && value !== formData.password && value.length > 0) {
        setPass2Error("Passwords do not match");
      } else {
        setPass2Error("");
      }
    }

    setFormData({
      ...formData,
      [name]: value
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pass1Error || pass2Error ||
      passwordCriteria.length === false || passwordCriteria.uppercase === false ||
      passwordCriteria.number === false || passwordCriteria.specialChar === false) {
      showMessage("Please correct the errors before submitting the form", true);
      return;
    }
    if (!formData.password || !formData.confirmPassword) {
      showMessage("All fields are required", true);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      showMessage("Passwords do not match", true);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${Back_Origin}/resetPassword/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: formData.password,
        })
      });

      const data = await response.json();
      setLoading(false);
      if (data.error) {
        showMessage(data.error, true);
      } else {
        showMessage(data.message, false);
        navigate('/login');
      }
    } catch (error) {
      setLoading(false);
      showMessage("Something went wrong. Please try again.", true);
      navigate('/login');
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={6}>
            <CCard className="p-4">
              <CCardBody>
                {loading ? (
                  <div className="d-flex justify-content-center align-items-center" style={{height: "338px"}}>
                    <CSpinner color="primary" style={{scale: '1.5'}}/>
                  </div>
                ) : (
                  <CForm onSubmit={handleSubmit}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h1 className="mb-0">Change Password</h1>
                      <CButton color="primary" style={{minWidth: "130px"}}
                               className="w-auto" onClick={() => navigate('/login')}>
                        Back to Login
                      </CButton>
                    </div>

                    <p className="text-body-secondary">Enter your new password</p>

                    <CInputGroup className={pass1Error ? "mb-1" : "mb-3"}>
                      <CFormInput
                        type={showPassword ? "text" : "password"}
                        className={pass1Error ? "password-error" : ""}
                        placeholder="New Password"
                        value={formData.password}
                        name="password"
                        onChange={handleInputChange}
                        required
                      />
                      <CInputGroupText onClick={() => setShowPassword(!showPassword)} style={{ cursor: "pointer" }}>
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </CInputGroupText>
                    </CInputGroup>
                    {pass1Error && <p className="text-danger mb-3">* {pass1Error}</p>}

                    <CListGroup className="mb-3" style={{paddingLeft: "30px"}}>
                      <CListGroupItem style={{display: "revert", border: "none"}}
                                      className={passwordCriteria.length ? 'text-success' : 'text-danger'}>
                        At least 8 characters
                      </CListGroupItem>
                      <CListGroupItem style={{display: "revert", border: "none"}}
                                      className={passwordCriteria.uppercase ? 'text-success' : 'text-danger'}>
                        At least one uppercase letter
                      </CListGroupItem>
                      <CListGroupItem style={{display: "revert", border: "none"}}
                                      className={passwordCriteria.number ? 'text-success' : 'text-danger'}>
                        At least one number
                      </CListGroupItem>
                      <CListGroupItem style={{display: "revert", border: "none"}}
                                      className={passwordCriteria.specialChar ? 'text-success' : 'text-danger'}>
                        At least one special character (-, @, $, !, %, *, ?, &)
                      </CListGroupItem>
                    </CListGroup>

                    <CInputGroup className={pass2Error ? "mb-1" : "mb-4"}>
                      <CFormInput
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm New Password"
                        className={pass2Error ? "password-error" : ""}
                        value={formData.confirmPassword}
                        name="confirmPassword"
                        onChange={handleInputChange}
                        required
                      />
                      <CInputGroupText onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)} style={{ cursor: "pointer" }}>
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </CInputGroupText>
                    </CInputGroup>
                    {pass2Error && <p className="text-danger mb-3">* {pass2Error}</p>}

                    <CRow>
                      <CCol xs={12} className="text-center">
                        <CButton color="primary" className="px-4" type="submit">
                          Change Password
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                )}
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  );
};

export default ResetPassword;
