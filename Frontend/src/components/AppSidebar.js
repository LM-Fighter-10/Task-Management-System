import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from '@coreui/react';
import { AppSidebarNav } from './AppSidebarNav';
import navigation from '../_nav'; // Sidebar nav config
import { useContext } from "react";
import { AppContext } from "src/App";

const AppSidebar = () => {
  const dispatch = useDispatch();
  const unfoldable = useSelector((state) => state.sidebarUnfoldable);
  const sidebarShow = useSelector((state) => state.sidebarShow);
  const { currentUser } = useContext(AppContext); // Get currentUser from context

  // State to hold dynamic navigation items
  const [filteredNav, setFilteredNav] = useState([]);

  // Filter navigation items dynamically based on authentication status
  useEffect(() => {
    setFilteredNav(
      navigation.filter((item) => {
        if (!currentUser) {
          // Hide these pages if no user is logged in
          return !["Notifications", "Task", "Projects", "Users", "User Table"].includes(item.name);
        }

        if (currentUser?.role === "user" || currentUser?.role === "manager") {
          // Hide "Account Pages" and "Users" for manager and user roles
          return !["Account Pages", "Users", "User Table"].includes(item.name);
        }

        if (currentUser?.role === "admin") {
          // Hide "About Us" and "Contact Us" for admin role
          return !["About US", "Contact US","Account Pages"].includes(item.name);
        }

        return true;
      })
    );
  }, [currentUser, navigation]);


  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: 'set', sidebarShow: visible });
      }}
    >
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand className="nav-link active" style={{ padding: '16px', fontSize: "26px", gap: "20px" }}>
          <img src="/logo-T.png" alt="Logo" style={{ height: '35px' }} />
          Task Pulse
        </CSidebarBrand>
        <CCloseButton className="d-lg-none"
                      dark onClick={() => dispatch({ type: 'set', sidebarShow: false })} />
      </CSidebarHeader>

      {/* Use dynamically filtered navigation */}
      <AppSidebarNav items={filteredNav} />

      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler
          onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })} />
      </CSidebarFooter>
    </CSidebar>
  );
};

export default React.memo(AppSidebar);
