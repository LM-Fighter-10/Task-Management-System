import React, {useContext, useEffect, useState} from 'react'
import {
  CAvatar,
  CBadge,
  CDropdown,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle, CSpinner,
} from '@coreui/react'
import {
  cilBell,
  cilCommentSquare,
  cilFile,
  cilTask,
  cilUser,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { Link, useNavigate } from 'react-router-dom'
import avatar8 from './../../assets/images/avatars/3.jpg'
import {AppContext} from "src/App";
import {Back_Origin} from "../../../../Frontend_ENV";

const AppHeaderDropdown = () => {
  const {currentUser, setCurrentUser, showMessage} = useContext(AppContext);
  const navigate = useNavigate();
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [userStats, setUserStats] = useState({
    tasks: "N/A",
    comments: "N/A",
    updates: "N/A",
    projects: "N/A"
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
    showMessage("You have been logged out successfully.", null);
    navigate("/");
  }

  useEffect(() => {
    if (currentUser) {
      if (currentUser?.avatar) {
        setLoadingAvatar(true);
        const img = new Image();
        img.onload = () => setLoadingAvatar(false);
        img.src = currentUser.avatar;
      }
      const fetchUserStats = async () => {
        try {
          const response = await fetch(`${Back_Origin}/getUserStats`, {
            method: "GET",
            headers: {
              "authorization" : localStorage.getItem("token")
            }
          });
          const data = await response.json();
          if (data.error) {
            showMessage(data.error, true);
          } else {
            setUserStats(data.data);
          }
        } catch (e) {
          showMessage('An unexpected error occurred', true);
        }
      }
      fetchUserStats();
    }
  }, [currentUser]);

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        {/*<CAvatar src={currentUser?.avatar || avatar8} size="md"/>*/}
        <div className="d-flex justify-content-center align-items-center position-relative">
          <CAvatar
            key={currentUser ? currentUser.avatar : "avatar"}
            className={loadingAvatar ? "opacity-25" : ""}
            src={!loadingAvatar && currentUser ? currentUser.avatar : avatar8}
            size="md"
          />
          {loadingAvatar && <CSpinner className="position-absolute" color="primary"/>}
        </div>
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        {
          currentUser?.role !== "admin" && (
            <>
              <CDropdownHeader className="bg-body-secondary fw-semibold mb-2">Account</CDropdownHeader>
              <CDropdownItem>
                <CIcon icon={cilBell} className="me-2"/>
                Updates
                <CBadge color="info" className="ms-2">
                  {userStats.updates}
                </CBadge>
              </CDropdownItem>
              <CDropdownItem>
                <CIcon icon={cilTask} className="me-2"/>
                Tasks
                <CBadge color="danger" className="ms-2">
                  {userStats.tasks}
                </CBadge>
              </CDropdownItem>
              <CDropdownItem>
                <CIcon icon={cilCommentSquare} className="me-2" />
                Comments
                <CBadge color="warning" className="ms-2">
                  {userStats.comments}
                </CBadge>
              </CDropdownItem>
              <CDropdownItem>
                <CIcon icon={cilFile} className="me-2" />
                Projects
                <CBadge color="primary" className="ms-2">
                  {userStats.projects}
                </CBadge>
              </CDropdownItem>
            </>
          )
        }
        <CDropdownHeader className={"bg-body-secondary fw-semibold my-2 " +
          ((currentUser.role === "admin") && "mt-0")}>Settings</CDropdownHeader>
        <CDropdownItem as={Link} to="/profile">
          <CIcon icon={cilUser} className="me-2" />
          Profile
        </CDropdownItem>
        <CDropdownItem onClick={handleLogout} style={{cursor: "pointer"}}>
            <CIcon icon={cilUser} className="me-2" />
            Logout
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default React.memo(AppHeaderDropdown);
