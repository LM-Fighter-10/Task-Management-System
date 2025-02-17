import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CContainer, CSpinner } from '@coreui/react'
import { AppContent, AppSidebar, AppFooter, AppHeader } from '../components/index'

const AboutUs = React.lazy(() => import('../views/aboutus/Aboutus'))
const ContactUs = React.lazy(() => import('../views/contactus/Contactus'))
const Dashboard = React.lazy(() => import('../views/dashboard/Dashboard'))
const TaskTable = React.lazy(() => import('../views/tasks/tasks'))
const ProjectTable = React.lazy(() => import('../views/projects/projects'))
const Notifications = React.lazy(() => import('../views/notifications/notifications'))
const ProfileView = React.lazy(() => import('../views/profileview/ProfileView'))
const Page404 = React.lazy(() => import('../views/pages/404-page/page404'))
const User = React.lazy(() => import('../views/pages/user/user'))

const DefaultLayout = () => {
  return (
    <div>
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="body flex-grow-1">
          <CContainer fluid>
            <Suspense
              fallback={
                <div className="pt-3 text-center">
                  <CSpinner color="primary" variant="grow" />
                </div>
              }
            >
              <Routes>
                <Route path="/about" name="About Us" element={<AboutUs />} />
                <Route path="/contact" name="Contact Us" element={<ContactUs />} />
                <Route path="/dashboard" name="Dashboard" element={<Dashboard />} />
                <Route path="/projects" name="Project Table" element={<ProjectTable />} />
                <Route path="/notifications" name="Notifications" element={<Notifications />} />
                <Route path="/tasks" name="Task Table" element={<TaskTable />} />
                <Route path="/users" name="User Table" element={<User />} />
                <Route exact path="*" name="Page 404" element={<Page404 />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/profile" name="Profile" element={<ProfileView />} />
              </Routes>
            </Suspense>
          </CContainer>
        </div>
        <AppFooter />
      </div>
    </div>
  )
}

export default DefaultLayout
