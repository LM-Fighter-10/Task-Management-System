import React, {useState, useContext, useEffect} from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CListGroup,
  CListGroupItem,
  CAvatar,
  CBadge,
  CButton,
  CFormInput,
  CFormSelect,
  CForm, CSpinner
} from '@coreui/react'
import { useNavigate } from 'react-router-dom';
import { AppContext } from 'src/App'
import avatar8 from '../../assets/images/avatars/3.jpg';
import {Back_Origin} from "../../../../Frontend_ENV";

const ProfileView = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { currentUser, setCurrentUser, showMessage } = useContext(AppContext);
  const [user, setUser] = useState({
    name: currentUser?.name || 'N/A',
    username: currentUser?.username || 'N/A',
    email: currentUser?.email || 'N/A',
    gender: currentUser?.gender || 'N/A',
    role: currentUser?.role || 'user',
    avatar: currentUser?.avatar || avatar8,
  });
  const [loading, setLoading] = useState(false);
  const [loadingAvatar, setLoadingAvatar] = useState(true);
  const [formData, setFormData] = useState({ ...user });
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      setLoadingAvatar(false);
    }, 100);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'gender') {
      setLoadingAvatar(true);
      let newAvatarUrl;

      if (value === 'Male') {
        newAvatarUrl = `${Back_Origin}/static/avatars/${Math.floor(Math.random() * 50) + 1}.png`;
      } else {
        newAvatarUrl = `${Back_Origin}/static/avatars/${Math.floor(Math.random() * 50) + 51}.png`;
      }

      setFormData(prev => ({
        ...prev,
        avatar: newAvatarUrl, // Set avatar with cache busting
        gender: value
      }));

      setTimeout(() => {
        setLoadingAvatar(false); // Ensure the loading spinner disappears after update
      }, 100);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };


  const handleAvatarChange = async () => {
    setLoadingAvatar(true);

    let newAvatarUrl;
    if (formData.gender === "Male") {
      newAvatarUrl = `${Back_Origin}/static/avatars/${Math.floor(Math.random() * 50) + 1}.png`;
    } else {
      newAvatarUrl = `${Back_Origin}/static/avatars/${Math.floor(Math.random() * 50) + 51}.png`;
    }

    // Force React to render immediately by updating state before fetch
    setFormData((prev) => ({
      ...prev,
      avatar: newAvatarUrl,
    }));

    setTimeout(() => {
      setLoadingAvatar(false); // Ensure the loading spinner disappears after update
    }, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!localStorage.getItem("token")) {
      return;
    }
    setIsEditing(false);
    setLoading(true);
    const response = await fetch(`${Back_Origin}/updateUser/${currentUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `${localStorage.getItem('token')}`
      },
      body: JSON.stringify(formData)
    });
    const data = await response.json();

    if (!data.error) {
      localStorage.setItem('token', data.data.token);
      setCurrentUser(data.data.user);
      setUser(data.data.user);
      setFormData(data.data.user);
      showMessage("Profile Changed", false);
    } else {
      showMessage(data.error, true);
      setFormData(user);
    }
    setLoading(false);
  }

  const handleChangePassword = async () => {
    try {
      if (!localStorage.getItem("token")) {
        return;
      }
      setLoading(true);
      const response = await fetch(`${Back_Origin}/forgotPassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `${localStorage.getItem('token')}`
        },
        body: JSON.stringify({email: user.email, isedit: true})
      });
      const data = await response.json();
      if (!data.error) {
        showMessage("This page will expire in 10 minutes", null);
        navigate('/changepassword/' + data.data.resetToken);
      } else {
        showMessage(data.error, true);
      }
    } catch (e) {
      showMessage("Something went wrong. Please try again.", true);
      navigate('/profile');
    }
  }

  const handleCancel = () => {
    if (formData.avatar !== user.avatar) {
      setLoadingAvatar(true);
      setFormData(user);
      setIsEditing(false)
      setTimeout(() => {
        setLoadingAvatar(false);
      }, 100);
      return;
    }
    setFormData(user)
    setIsEditing(false)
  }

  const getRoleBadge = (role) => {
    const roleMap = {
      admin: 'danger',
      manager: 'warning',
      user: 'primary',
    }
    return <CBadge color={roleMap[role]}>{role.toUpperCase()}</CBadge>
  }

  return (
    <CRow className="justify-content-center pb-4">
      <CCol md={6}>
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">User Profile</h4>
              {!isEditing && (
                <div>
                  <CButton color="primary" onClick={() => setIsEditing(true)} className="me-2">
                    Edit Profile
                  </CButton>
                </div>
              )}
            </CCardHeader>

            <CForm onSubmit={handleSubmit}>
              {
                loading? (
                  <div className="d-flex justify-content-center align-items-center" style={{height: "376px"}}>
                    <CSpinner color="primary" style={{scale: '1.5'}}/>
                  </div>
                ) : (
                  <CCardBody>
                    <div className="text-center mb-4 d-flex flex-column justify-content-center align-items-center gap-3">
                        <div className="d-flex justify-content-center align-items-center position-relative">
                          <CAvatar
                            key={formData.avatar}
                            className={loadingAvatar ? "opacity-25" : ""}
                            src={formData.avatar}
                            size="xl"
                          />
                          {loadingAvatar && <CSpinner className="position-absolute" color="primary"/>}
                        </div>
                      {isEditing &&
                        <CButton color="success" style={{fontSize: "14px"}} disabled={loadingAvatar}
                                 onClick={handleAvatarChange}>
                          Change Avatar
                        </CButton>
                      }
                    </div>

                    <CListGroup>
                      {/* Name Field */}
                      <CListGroupItem>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold">Name</span>
                          {isEditing ? (
                            <CFormInput
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              style={{ width: '60%' }}
                            />
                          ) : (
                            <span>{user.name}</span>
                          )}
                        </div>
                      </CListGroupItem>

                      {/* Username Field */}
                      <CListGroupItem>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold">Username</span>
                          {isEditing ? (
                            <CFormInput
                              type="text"
                              name="username"
                              value={formData.username}
                              onChange={handleInputChange}
                              style={{ width: '60%' }}
                            />
                          ) : (
                            <span>{user.username}</span>
                          )}
                        </div>
                      </CListGroupItem>

                      {/* Email Field */}
                      <CListGroupItem>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold">Email</span>
                          {isEditing ? (
                            <CFormInput
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              style={{ width: '60%' }}
                            />
                          ) : (
                            <span>{user.email}</span>
                          )}
                        </div>
                      </CListGroupItem>

                      {/* Password Field */}
                      {
                        !isEditing &&
                        <CListGroupItem>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold">Password</span>
                            <CButton color="warning" style={{fontSize: "14px"}} onClick={handleChangePassword}>
                              Change Password
                            </CButton>
                          </div>
                        </CListGroupItem>
                      }

                      {/* Gender Field */}
                      <CListGroupItem>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold">Gender</span>
                          {isEditing ? (
                            <CFormSelect
                              name="gender"
                              value={formData.gender}
                              onChange={handleInputChange}
                              style={{ width: '60%', cursor: 'pointer' }}
                            >
                              <option>Male</option>
                              <option>Female</option>
                            </CFormSelect>
                          ) : (
                            <span>{user.gender}</span>
                          )}
                        </div>
                      </CListGroupItem>

                      {/* Role Field (non-editable) */}
                      <CListGroupItem className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold">Role</span>
                        {getRoleBadge(user.role)}
                      </CListGroupItem>
                    </CListGroup>

                    {isEditing && (
                      <div className="mt-4 d-flex justify-content-end gap-2">
                        <CButton color="secondary" onClick={handleCancel}>
                          Cancel
                        </CButton>
                        <CButton color="primary" type="submit">
                          Save Changes
                        </CButton>
                      </div>
                    )}
                  </CCardBody>
                )
              }
            </CForm>
      </CCard>
      </CCol>
    </CRow>
  )
}

export default ProfileView
