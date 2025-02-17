import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter className="px-4">
      <div>
        <span className="ms-1">All rights reserved to &copy; 2025 Team Task Pulse</span>
      </div>
      <div className="ms-auto">
        <span className="me-1">Task Management System</span>
        
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
