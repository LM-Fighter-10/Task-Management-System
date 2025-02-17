import React, { Suspense, useEffect, useState, createContext } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ToastContainer, toast } from 'react-toastify'
import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'
import {jwtDecode} from 'jwt-decode'
import { io } from 'socket.io-client'
import { Back_Origin } from '../../Frontend_ENV'

const socket = io(Back_Origin) // WebSocket URL

// Lazy-loaded pages & layouts
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))
const Login = React.lazy(() => import('./views/pages/login/Login'))
const Register = React.lazy(() => import('./views/pages/register/Register'))
const ForgetPassword = React.lazy(() => import('./views/pages/forget_password/forgetpassword'))
const ChangePassword = React.lazy(() => import('./views/pages/change_password/ChangePassword'))
const ResetPassword = React.lazy(() => import('./views/pages/reset_password/ResetPassword'))

export const AppContext = createContext()

let messagesList = []

// Helper: Check if current path matches any given regex patterns.
const matchesAny = (path, patterns) => patterns.some((regex) => regex.test(path))

/*
  Define allowed paths for each role.
  Adjust these regex patterns to exactly match your routes.
  - guest: Only public authentication pages.
  - user: Regular users (they can access most of the public app pages).
  - manager: Everything a user can access plus, for example, the /users page.
  - admin: No restrictions.
*/
const roleAllowedPaths = {
  guest: [
    /^\/$/,
    /^\/dashboard/,
    /^\/about/,
    /^\/contact/,
    /^\/login/,
    /^\/register/,
    /^\/forgetpassword/,
    /^\/resetPassword/
  ],
  user: [
    /^\/$/,
    /^\/dashboard/,
    /^\/about/,
    /^\/contact/,
    /^\/projects/,
    /^\/notifications/,
    /^\/tasks/,
    /^\/profile/,
    /^\/changepassword/,
  ],
  manager: [
    /^\/$/,
    /^\/dashboard/,
    /^\/about/,
    /^\/contact/,
    /^\/projects/,
    /^\/notifications/,
    /^\/tasks/,
    /^\/profile/,
    /^\/changepassword/,
  ],
  admin: [
    /^\/$/,
    /^\/dashboard/,
    /^\/projects/,
    /^\/notifications/,
    /^\/tasks/,
    /^\/profile/,
    /^\/changepassword/,
    /^\/users/ // For example, manager can access the user table.
  ]
}

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state) => state.theme)
  const [currentUser, setCurrentUser] = useState(null)
  const [hasNewNotifications, setHasNewNotifications] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Set the color theme.
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]
    if (theme) {
      setColorMode(theme)
    }
    if (!isColorModeSet()) {
      setColorMode(storedTheme)
    }
  }, [isColorModeSet, setColorMode, storedTheme])

  // Set the current user if a token is found.
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setCurrentUser(jwtDecode(token))
    }
  }, [])

  // Regularly check token expiration.
  useEffect(() => {
    let interval
    if (currentUser) {
      interval = setInterval(() => {
        const token = localStorage.getItem('token')
        if (!token) {
          clearInterval(interval)
          setCurrentUser(null)
        } else if (currentUser.exp < Date.now() / 1000) {
          clearInterval(interval)
          localStorage.removeItem('token')
          setCurrentUser(null)
          showMessage('Your session has expired. Please login again', true)
          navigate('/login')
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [currentUser, navigate])

  // Listen for new notifications.
  useEffect(() => {
    if (currentUser) {
      socket.emit('joinNotifications', currentUser.id)
      socket.on('newNotification', (notification) => {
        setHasNewNotifications(true)
        showMessage('You have a new notification', null)
      })
      return () => {
        socket.off('newNotification')
      }
    }
  }, [currentUser])

  // Role-based access control for every route change.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && currentUser) {
      // If the current path is one of the public routes (/login, /register, /forgetpassword, /resetPassword)
      // and we already have a user, just navigate them away without showing "Unauthorized".
      if (/^\/(login|register|forgetpassword|resetPassword)/.test(location.pathname)) {
        navigate('/') // or navigate('/dashboard')
      } else {
        // Normal role-based check
        const role = currentUser.role ? currentUser.role.toLowerCase() : 'user'
        const allowedPaths = roleAllowedPaths[role] || []
        if (!matchesAny(location.pathname, allowedPaths)) {
          showMessage('Unauthorized access', true)
          navigate('/')
        }
      }
    } else if (!token && !currentUser) {
      // Guest logic
      if (!matchesAny(location.pathname, roleAllowedPaths.guest)
        && !messagesList.includes("You have been logged out successfully.")) {
        showMessage('You need to login to access this page', true)
        navigate('/login')
      }
    }
  }, [location.pathname, currentUser])

  // Helper to display toast messages.
  const showMessage = (msg, error) => {
    if (msg && (error === true || error === false)) {
      if (!messagesList.includes(msg)) {
        messagesList.push(msg)
        toast[error ? 'error' : 'success'](msg, {
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: {
            userSelect: 'none',
            gap: '10px',
            padding: '20px'
          },
          onClose: () => {
            messagesList = messagesList.filter((e) => e !== msg)
          }
        })
      }
    } else if (msg && error === null) {
      if (!messagesList.includes(msg)) {
        messagesList.push(msg)
        toast.info(msg, {
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: {
            userSelect: 'none',
            gap: '10px',
            padding: '20px'
          },
          onClose: () => {
            messagesList = messagesList.filter((e) => e !== msg)
          }
        })
      }
    }
  }

  return (
    <AppContext.Provider value={{ currentUser, setCurrentUser, showMessage, hasNewNotifications, setHasNewNotifications }}>
      <ToastContainer style={{ width: 'fit-content' }} />
      <Suspense
        fallback={
          <div className="pt-3 text-center">
            <CSpinner color="primary" variant="grow" />
          </div>
        }
      >
        <Routes>
          <Route path="/login" name="Login Page" element={<Login />} />
          <Route path="/register" name="Register Page" element={<Register />} />
          <Route path="/forgetpassword" name="Forget Password" element={<ForgetPassword />} />
          <Route path="/changepassword/:token" name="Change Password" element={<ChangePassword />} />
          <Route path="/resetPassword/:token" name="Reset Password" element={<ResetPassword />} />
          {/* All other routes are handled by DefaultLayout */}
          <Route path="*" name="Home" element={<DefaultLayout />} />
        </Routes>
      </Suspense>
    </AppContext.Provider>
  )
}

export default App
