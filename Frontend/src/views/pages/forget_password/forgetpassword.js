import React, {useContext, useState} from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  CRow, CSpinner
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilEnvelopeClosed } from '@coreui/icons'
import { AppContext } from 'src/App'
import {Back_Origin} from "../../../../../Frontend_ENV";

const ForgetPassword = () => {
  const { showMessage } = useContext(AppContext);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email) {
      showMessage("Email is required", true);
      return;
    }
    // Send email to the server
    try {
      setLoading(true);
      let theme = localStorage.getItem('coreui-free-react-admin-template-theme');
      fetch(`${Back_Origin}/forgotPassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, isedit: false, theme }),
      })
        .then((response) => response.json())
        .then((data) => {
          setLoading(false);
          if (data.error) {
            showMessage(data.error, true);
          } else {
            showMessage(data.message, false);
            navigate("/login");
          }
        });

    } catch (e) {
      setLoading(false);
      showMessage("Something went wrong. Please try again.", true);
    }
  }

  const handleInputChange = (e) => {
    setEmail(e.target.value);
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup>
              <CCard className="p-4">
                {
                  loading ? (
                    <CCardBody className="text-center d-flex justify-content-center align-items-center">
                      <CSpinner color="primary" variant="grow"/>
                    </CCardBody>
                  ) : (
                    <CCardBody>
                      <CForm onSubmit={handleSubmit}>
                        <h1>Forget Password</h1>
                        <p className="text-body-secondary">Enter your email to reset your password</p>
                        <CInputGroup className="mb-4">
                          <CInputGroupText>
                            <CIcon icon={cilEnvelopeClosed} />
                          </CInputGroupText>
                          <CFormInput type="email" placeholder="Email" required
                                      autoComplete="email" value={email} onChange={handleInputChange} />
                        </CInputGroup>
                        <CRow>
                          <CCol xs={6}>
                            <CButton color="primary" className="px-4" type="submit">
                              Submit
                            </CButton>
                          </CCol>
                        </CRow>
                      </CForm>
                    </CCardBody>
                  )
                }
              </CCard>
              <CCard className={"text-white bg-primary py-5" +  (loading? " disable-div" : "")} style={{ width: '44%' }}>
                <CCardBody className="text-center">
                  <div>
                    <h2>Welcome Back!</h2>
                    <p>
                      Enter your email address and we'll send you a link to reset your password.
                    </p>
                    <Link to="/login">
                      <CButton color="primary" className="mt-3" active tabIndex={-1}>
                        Back to Login
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

export default ForgetPassword
