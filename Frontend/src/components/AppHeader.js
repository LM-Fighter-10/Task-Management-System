import React, {useContext, useEffect, useRef} from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  CContainer,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  CNavLink,
  CNavItem,
  useColorModes,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilContrast,
  cilEnvelopeOpen,
  cilList,
  cilMenu,
  cilMoon,
  cilSun,
} from '@coreui/icons'
import { AppContext } from 'src/App'

import { AppBreadcrumb } from './index'
import { AppHeaderDropdown } from './header/index'

const AppHeader = () => {
  const headerRef = useRef()
  const { currentUser, hasNewNotifications } = useContext(AppContext);
  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')

  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebarShow)

  useEffect(() => {
    document.addEventListener('scroll', () => {
      headerRef.current &&
        headerRef.current.classList.toggle('shadow-sm', document.documentElement.scrollTop > 0)
    })
  }, [])

  return (
    <CHeader position="sticky" className="mb-4 p-0" ref={headerRef}>
      <CContainer className="border-bottom px-4" fluid>
        {!currentUser ? (
          <div className="d-flex">
            <CHeaderToggler
              onClick={() => dispatch({ type: 'set', sidebarShow: !sidebarShow })}
              style={{ marginInlineStart: '-14px' }}
            >
              <CIcon icon={cilMenu} size="lg" />
            </CHeaderToggler>
            <CHeaderNav className="d-none d-md-flex">
              <CNavItem>
                <CNavLink to="/dashboard" as={NavLink}>
                  Dashboard
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink to="/about" as={NavLink}>
                  About Us
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink to="/contact" as={NavLink}>
                  Contact Us
                </CNavLink>
              </CNavItem>
            </CHeaderNav>
          </div>
        ) : (
          <>
            <CHeaderToggler
              onClick={() => dispatch({ type: 'set', sidebarShow: !sidebarShow })}
              style={{ marginInlineStart: '-14px' }}
            >
              <CIcon icon={cilMenu} size="lg" />
            </CHeaderToggler>
            <CHeaderNav className="d-none d-md-flex">
              <CNavItem>
                <CNavLink to="/dashboard" as={NavLink}>
                  Dashboard
                </CNavLink>
              </CNavItem>
              {/* Show About/Contact only for non-admin users */}
              {currentUser?.role !== 'admin' && (
                <>
                  <CNavItem>
                    <CNavLink to="/about" as={NavLink}>
                      About Us
                    </CNavLink>
                  </CNavItem>
                  <CNavItem>
                    <CNavLink to="/contact" as={NavLink}>
                      Contact Us
                    </CNavLink>
                  </CNavItem>
                </>
              )}
            </CHeaderNav>
          </>
        )}
        {currentUser && (
          <CHeaderNav className="ms-auto">
            <CNavItem>
              <CNavLink to="/notifications" as={NavLink} className="position-relative">
                <CIcon icon={cilBell} size="lg" />
                {hasNewNotifications && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: "24px",
                      right: "6px",
                      width: "10px",
                      height: "10px",
                      backgroundColor: "blue",
                      borderRadius: "50%",
                    }}
                  />
                )}
              </CNavLink>
            </CNavItem>
          </CHeaderNav>
        )}
        <CHeaderNav>
          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>
          <CDropdown variant="nav-item" placement="bottom-end">
            <CDropdownToggle caret={false}>
              {colorMode === 'dark' ? (
                <CIcon icon={cilMoon} size="lg" />
              ) : colorMode === 'auto' ? (
                <CIcon icon={cilContrast} size="lg" />
              ) : (
                <CIcon icon={cilSun} size="lg" />
              )}
            </CDropdownToggle>
            <CDropdownMenu>
              <CDropdownItem
                active={colorMode === 'light'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                onClick={() => setColorMode('light')}
              >
                <CIcon className="me-2" icon={cilSun} size="lg" /> Light
              </CDropdownItem>
              <CDropdownItem
                active={colorMode === 'dark'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                onClick={() => setColorMode('dark')}
              >
                <CIcon className="me-2" icon={cilMoon} size="lg" /> Dark
              </CDropdownItem>
              <CDropdownItem
                active={colorMode === 'auto'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                onClick={() => setColorMode('auto')}
              >
                <CIcon className="me-2" icon={cilContrast} size="lg" /> Auto
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
          {currentUser && (
            <>
              <li className="nav-item py-1">
                <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
              </li>
              <AppHeaderDropdown/>
            </>
          )}
        </CHeaderNav>
      </CContainer>
      <CContainer className="px-4" fluid>
        <AppBreadcrumb/>
      </CContainer>
    </CHeader>
  )
}

export default AppHeader
