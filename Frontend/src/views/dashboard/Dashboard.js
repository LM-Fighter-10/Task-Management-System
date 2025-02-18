import React, {useContext, useEffect, useState} from 'react';
import { AppContext } from 'src/App';
import {
  CAvatar, CButton,
  CCard, CCardBody,
  CCardFooter, CCardHeader,
  CCol, CProgress,
  CRow, CTable,
  CTableBody, CTableDataCell,
  CTableHead, CTableHeaderCell,
  CTableRow, CCardTitle,
  CCardText, CCardImage, CSpinner,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import MainChart from './MainChart'
import { cilUser } from '@coreui/icons';
import {Button, Pagination} from "react-bootstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMinus} from "@fortawesome/free-solid-svg-icons";
import {Back_Origin} from "../../../../Frontend_ENV";
import {NavLink} from "react-router-dom";

const FeatureCard = ({ title, text }) => {
  const [hover, setHover] = useState(false);

  return (
    <CCard
      className="border-0 shadow-sm p-4 my-2"
      style={{
        transform: hover ? "translateY(-10px)" : "translateY(0)",
        boxShadow: hover
          ? "0 10px 20px rgba(0, 0, 0, 0.2)"
          : "0 4px 8px rgba(0, 0, 0, 0.1)",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <CCardTitle className="fs-4 fw-bold">{title}</CCardTitle>
      <CCardText>{text}</CCardText>
    </CCard>
  );
};

const Dashboard = () => {
  const {currentUser, showMessage} = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [loading2, setLoading2] = useState(true);
  const [loading3, setLoading3] = useState(true);
  const [loading4, setLoading4] = useState(true);
  const [chartData, setChartData] = useState({
    completedTasks: {value: 0, percent: 0},
    pendingTasks: {value: 0, percent: 0},
    ongoingProjects: {value: 0, percent: 0},
    teamMembers: {value: 0, percent: 0},
    labels: [],
  });
  const [recentActivity, setRecentActivity] = useState({
    newTasks: 0,
    completedTasks: 0,
    ongoingProjects: 0,
    newTeamMembers: 0,
  });
  const [projectTaskStats, setProjectTaskStats] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [usersList, setUsersList] = useState([]);
  const [projectSelected, setProjectSelected] = useState(undefined);
  // useRef for list of projects cards
  const projectCards = React.useRef([]);

  const fetchChartData = async () => {
    try {
      if (!localStorage.getItem("token")) {
        return;
      }
      setLoading(true);
      const response = await fetch(`${Back_Origin}/getStatistics`, {
        method: "GET",
        headers: {"authorization": `${localStorage.getItem("token")}`},
      });
      const result = await response.json();
      setLoading(false);
      if (!result.error && result.data) {
        setChartData(result.data);
      } else {
        showMessage(result.error, true);
      }
    } catch (error) {
      setLoading(false);
      showMessage('An unexpected error occurred', true);
    }
  }

  const fetchRecentActivity = async () => {
    try {
      if (!localStorage.getItem("token")) {
        return;
      }
      setLoading2(true);
      const response = await fetch(`${Back_Origin}/getRecentActivity`, {
        method: "GET",
        headers: {"authorization": `${localStorage.getItem("token")}`},
      });
      const result = await response.json();
      setLoading2(false);
      if (!result.error && result.data) {
        setRecentActivity(result.data);
      } else {
        showMessage(result.error, true);
      }
    } catch (error) {
      setLoading2(false);
      showMessage('An unexpected error occurred', true);
    }
  }

  const fetchProjectTaskStats = async (page = 1, limit = 5) => {
    try {
      if (!localStorage.getItem("token")) {
        return;
      }
      setLoading3(true);
      setCurrentPage(page);
      const response = await fetch(`${Back_Origin}/getProjectTaskStats?page=${page}&limit=${limit}`, {
        method: "GET",
        headers: {"authorization": `${localStorage.getItem("token")}`},
      });
      const result = await response.json();
      setLoading3(false);
      if (!result.error && result.data) {
        setProjectTaskStats(result.data);
        setTotalPages(result.totalPages);
      } else {
        showMessage(result.error, true);
      }
    } catch (error) {
      setLoading3(false);
      showMessage('An unexpected error occurred', true);
    }
  }

  const fetchUsersList = async () => {
    try {
      if (!projectSelected || !localStorage.getItem("token")) {
        return;
      }
      setLoading4(true);
      const response = await fetch(`${Back_Origin}/getMembersForProjDashboard/${projectSelected}`, {
        method: "GET",
        headers: {"authorization": `${localStorage.getItem("token")}`},
      });
      const result = await response.json();
      setLoading4(false);
      if (!result.error && result.data) {
        setUsersList(result.data);
      } else {
        showMessage(result.error, true);
      }
    } catch (error) {
      setLoading4(false);
      showMessage('An unexpected error occurred', true);
    }
  }

  const fetchData = async () => {
    if (!currentUser || !localStorage.getItem("token")) {
      return;
    }
    await fetchChartData();
    await fetchRecentActivity();
    await fetchProjectTaskStats();
    await fetchUsersList();
  }

  useEffect(() => {
    // add on hover effect to project cards to add (project-selected) class
    projectTaskStats && projectCards.current.forEach((card, index) => {
      card.addEventListener("click", () => {
        projectCards.current.forEach((c, i) => {
          if (i !== index) {
            c.classList.remove("project-selected");
          }
        });
        if (card.classList.contains("project-selected")) {
          setProjectSelected(null);
        } else {
          setProjectSelected(projectTaskStats[index]?.projID);
        }
        card.classList.toggle("project-selected");
      });
    });
  }, [projectTaskStats]);

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  useEffect(() => {
    setProjectSelected(null);
  }, [currentPage]);

  useEffect(() => {
    if (projectSelected) {
      fetchUsersList();
    }
  }, [projectSelected]);

  // Guest View: Landing Page
  if (!currentUser) {
    return (
      <>
        {/* Hero Section */}
        <CRow className="text-center mb-5">
          <CCol>
            <h1 className=" mt-3 mb-4 fw-bold">Welcome to Task Management System</h1>
            <p className="text-body-secondary mb-4 fs-5 text-center">
              Our Task Management System is designed to help teams and individuals stay organized, <br/>
              improve productivity, and track progress efficiently. Manage your tasks, collaborate with <br/>
              your team, and achieve your project goals seamlessly.
            </p>
            <div>
              <CButton color="primary" className="me-3 px-4 py-2" as={NavLink} to={"/login"}>Login</CButton>
              <CButton color="success" className="px-4 py-2" as={NavLink} to={"/register"}>Register</CButton>
            </div>
          </CCol>
        </CRow>

        {/* Features Section */}
        <CRow className="text-center my-5 mx-3">
          <CCol md={4}>
            <FeatureCard
              title="Task Management"
              text="Assign, track, and manage tasks with ease. Stay on top of deadlines and priorities."
            />
          </CCol>
          <CCol md={4}>
            <FeatureCard
              title="Collaboration"
              text="Work together with your team, share updates, and communicate effortlessly."
            />
          </CCol>
          <CCol md={4}>
            <FeatureCard
              title="Performance Tracking"
              text="Monitor progress, set goals, and enhance productivity with analytics."
            />
          </CCol>
        </CRow>


        {/* About Our Team */}
        <CRow className="text-center my-5">
          <CCol>
            <h2 className="fw-bold">Meet Our Team</h2>
            <p className="text-body-secondary fs-5">
              Our dedicated team of professionals works tirelessly to bring you the best experience in task management.
            </p>
          </CCol>
        </CRow>

        {/* Team Members */}
        <CRow className="justify-content-center">
          <CCol md={3} className="mb-4">
            <CCard className="border-0 shadow-sm text-center">
              <CCardImage src="/src/assets/images/burhan.jpg" className=" mx-auto " width="100"/>
              <CCardBody>
                <CCardTitle className="fw-bold">Burhan Khan</CCardTitle>
                <CCardText>Frontend Developer</CCardText>
              </CCardBody>
            </CCard>
          </CCol>
          <CCol md={3} className="mb-4">
            <CCard className="border-0 shadow-sm text-center">
              <CCardImage src="/src/assets/images/omer.jpg" className="mx-auto" width="100"/>
              <CCardBody>
                <CCardTitle className="fw-bold">Omar Alaa Elnahass</CCardTitle>
                <CCardText>Backend Developer</CCardText>
              </CCardBody>
            </CCard>
          </CCol>
          <CCol md={3} className="mb-4">
            <CCard className="border-0 shadow-sm text-center">
              <CCardImage src="/src/assets/images/omotuwa.jpg" className="mx-auto" width="100"/>
              <CCardBody>
                <CCardTitle className="fw-bold">Omotuwa Ojo</CCardTitle>
                <CCardText>Backend Developer</CCardText>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </>
    );
  }

  // Admin Dashboard
  if (currentUser.role === 'admin') {
    return (
      <>
        {/* Hero Section */}
        <CRow className="text-center mb-5">
          <CCol>
            <h1 className="mb-4 fw-bold">Admin Dashboard</h1>
            <p className="text-body-secondary mb-4 fs-5 text-center" style={{
              maxWidth: "80%",
              marginLeft: "auto",
              marginRight: "auto"
            }}>
              Welcome {currentUser?.name} to the Admin Dashboard. Manage users, monitor tasks, and oversee system performance
              efficiently.
            </p>
            <div className="d-flex align-items-center justify-content-center gap-3 flex-wrap">
              <CButton color="secondary" className="px-4 py-2" as={NavLink} to={"/users"}>Users Table</CButton>
              <CButton color="primary" className="px-4 py-2" as={NavLink} to={"/tasks"}>Task Board </CButton>
              <CButton color="success" className="px-4 py-2" as={NavLink} to={"/projects"}>Project Board</CButton>
            </div>
          </CCol>
        </CRow>

        {/* Admin Features Section */}
        <CRow className="text-center my-5 mx-3">
          <CCol md={4}>
            <CCard className="border-0 shadow-sm p-4 admin-card h-100 justify-content-evenly">
              <CCardTitle className="fs-4 fw-bold">User Management</CCardTitle>
              <CCardText>Add, remove, and update user roles and access permissions.</CCardText>
            </CCard>
          </CCol>
          <CCol md={4}>
            <CCard className="border-0 shadow-sm p-4 admin-card h-100 justify-content-evenly">
              <CCardTitle className="fs-4 fw-bold">Task Management</CCardTitle>
              <CCardText>Add, Assign, monitor, and streamline tasks efficiently.</CCardText>
            </CCard>
          </CCol>
          <CCol md={4}>
            <CCard className="border-0 shadow-sm p-4 admin-card h-100 justify-content-evenly">
              <CCardTitle className="fs-4 fw-bold">Project Management</CCardTitle>
              <CCardText>Oversee multiple projects, set priorities, and track milestones.</CCardText>
            </CCard>
          </CCol>
        </CRow>
        <CRow className="text-center my-5 mx-3">
          <CCol md={4}>
            <CCard className="border-0 shadow-sm p-4 admin-card h-100 justify-content-evenly">
              <CCardTitle className="fs-4 fw-bold">System Analytics</CCardTitle>
              <CCardText>View reports, performance metrics, and data-driven insights.</CCardText>
            </CCard>
          </CCol>
          <CCol md={4}>
            <CCard className="border-0 shadow-sm p-4 admin-card h-100 justify-content-evenly">
              <CCardTitle className="fs-4 fw-bold">Team Collaboration</CCardTitle>
              <CCardText>Facilitate communication and teamwork with integrated tools.</CCardText>
            </CCard>
          </CCol>
          <CCol md={4}>
            <CCard className="border-0 shadow-sm p-4 admin-card h-100 justify-content-evenly">
              <CCardTitle className="fs-4 fw-bold">Notifications & Alerts</CCardTitle>
              <CCardText>Stay updated with real-time alerts on task updates and deadlines.</CCardText>
            </CCard>
          </CCol>
        </CRow>

        <style>
          {`
          .admin-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .admin-card:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
          }
        `}
        </style>


      </>
    );
  }

  // Manager/User Dashboard
  if (currentUser.role === 'manager' || currentUser.role === 'user') {
    return (
      <>
        <CCard className="mb-4">
          {
            loading? (
              <div className="d-flex justify-content-center align-items-center" style={{height: "508px"}}>
                <CSpinner color="primary" style={{scale: '1.5'}}/>
              </div>
            ) : (
              <>
                <CCardBody>
                  <CRow>
                    <CCol sm={5}>
                      <h4 id="traffic" className="card-title mb-0">
                        Task Management Overview
                      </h4>
                      <div className="small text-body-secondary">
                        {chartData.labels && chartData.labels[0]} - {chartData.labels && chartData.labels[chartData.labels.length - 1]}
                      </div>
                    </CCol>
                  </CRow>
                  <MainChart chartData={chartData}/>
                </CCardBody>
                <CCardFooter>
                  <CRow
                    xs={{cols: 1, gutter: 4}}
                    sm={{cols: 2}}
                    lg={{cols: 4}}
                    xl={{cols: 5}}
                    className="mb-2 text-center justify-content-around"
                  >
                    <CCol key={"Completed Tasks"}>
                      <div className="text-body-secondary">Completed Tasks</div>
                      <div className="fw-semibold text-truncate">
                        {chartData?.completedTasks?.value} {chartData?.completedTasks?.value !== 1 ? "Tasks" : "Task"} (
                        {chartData?.completedTasks?.percent}%)
                      </div>
                      <CProgress
                        thin
                        className="mt-2"
                        color={"success"}
                        value={Number(chartData?.completedTasks?.percent) || 0}
                      />
                    </CCol>
                    <CCol key={"Pending Tasks"}>
                      <div className="text-body-secondary">Pending Tasks</div>
                      <div className="fw-semibold text-truncate">
                        {chartData?.pendingTasks?.value} {chartData?.pendingTasks?.value !== 1 ? "Tasks" : "Task"} (
                        {chartData?.pendingTasks?.percent}%)
                      </div>
                      <CProgress
                        thin className="mt-2"
                        color={"warning"}
                        value={Number(chartData?.pendingTasks?.percent) || 0}
                      />
                    </CCol>
                    <CCol key={"Ongoing Projects"}>
                      <div className="text-body-secondary">Ongoing Projects</div>
                      <div className="fw-semibold text-truncate">
                        {chartData?.ongoingProjects?.value} {chartData?.ongoingProjects?.value !== 1 ? "Projects" : "Project"} (
                        {chartData?.ongoingProjects?.percent}%)
                      </div>
                      <CProgress
                        thin className="mt-2"
                        color={"info"}
                        value={Number(chartData?.ongoingProjects?.percent) || 0}
                      />
                    </CCol>
                    <CCol key={"Team Members"}>
                      <div className="text-body-secondary">Team Members</div>
                      <div className="fw-semibold text-truncate">
                        {chartData?.teamMembers?.value} {chartData?.teamMembers?.value !== 1 ? "Tasks" : "Task"} (
                        {chartData?.teamMembers?.percent}%)
                      </div>
                      <CProgress
                        thin className="mt-2"
                        color={"primary"}
                        value={Number(chartData?.teamMembers?.percent) || 0}
                      />
                    </CCol>
                  </CRow>
                </CCardFooter>
              </>
            )
          }
        </CCard>
        <CRow>
          <CCol xs>
            <CCard className="mb-4">
              <CCardHeader>Team Members {' & '} Activity</CCardHeader>
              <CCardBody>
                <CRow>
                  <CCol xs={12} md={6} xl={6}>
                    {
                      loading2? (
                        <div className="d-flex justify-content-center align-items-center position-relative"
                             style={{height: "75px", top: "-0.5rem"}}>
                          <CSpinner color="primary" style={{scale: '1.5'}}/>
                        </div>
                      ) : (
                        <CRow>
                          <CCol xs={6}>
                            <div className="border-start border-start-4 border-start-info py-1 px-3">
                              <div className="text-body-secondary text-truncate small">New Tasks</div>
                              <div className="fs-5 fw-semibold">{recentActivity?.newTasks}</div>
                            </div>
                          </CCol>
                          <CCol xs={6}>
                            <div className="border-start border-start-4 border-start-danger py-1 px-3 mb-3">
                              <div className="text-body-secondary text-truncate small">
                                Completed Tasks
                              </div>
                              <div className="fs-5 fw-semibold">{recentActivity?.completedTasks}</div>
                            </div>
                          </CCol>
                        </CRow>
                      )
                    }
                    <hr className="mt-0"/>
                    {
                      loading3? (
                        <div className="d-flex justify-content-center align-items-center" style={{height: "400px"}}>
                          <CSpinner color="primary" style={{scale: '1.5'}}/>
                        </div>
                      ) :
                        projectTaskStats.map((item, index) => (
                          <div style={{cursor: "pointer", borderRadius: "10px", border: "3px solid #ffffff00",
                            transition: "all 0.2s ease-in-out"}}
                               className="progress-group mb-4 py-2 px-3 user-select-none" key={item.projID}
                               ref={(el) => (projectCards.current[index] = el)}>
                            <div className="progress-group-prepend">
                              <span className="text-body-secondary small">{item.projName}</span>
                            </div>
                            <div className="progress-group-bars">
                              <CProgress thin color="info" value={item.newTasks}/>
                              <CProgress thin color="danger" value={item.completedTasks}/>
                            </div>
                          </div>
                        ))
                    }
                  </CCol>
                  <CCol xs={12} md={6} xl={6}>
                    {
                      loading2? (
                        <div className="d-flex justify-content-center align-items-center position-relative"
                             style={{height: "75px", top: "-0.5rem"}}>
                          <CSpinner color="primary" style={{scale: '1.5'}}/>
                        </div>
                      ) : (
                        <CRow>
                          <CCol xs={6}>
                            <div className="border-start border-start-4 border-start-warning py-1 px-3 mb-3">
                              <div className="text-body-secondary text-truncate small">Ongoing Projects</div>
                              <div className="fs-5 fw-semibold">{recentActivity?.ongoingProjects}</div>
                            </div>
                          </CCol>
                          <CCol xs={6}>
                            <div className="border-start border-start-4 border-start-success py-1 px-3 mb-3">
                              <div className="text-body-secondary text-truncate small">Team Members</div>
                              <div className="fs-5 fw-semibold">{recentActivity?.newTeamMembers}</div>
                            </div>
                          </CCol>
                        </CRow>
                      )
                    }
                    <hr className="mt-0"/>
                  </CCol>
                  {/* Pagination */}
                  {totalPages > 0 && (
                    <Pagination className="mt-3 justify-content-center">
                      <Pagination.Prev
                        onClick={() => currentPage > 1 && fetchProjectTaskStats(currentPage - 1)}
                        disabled={currentPage === 1} style={{cursor: "pointer"}}
                      />
                      {Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
                        <Pagination.Item
                          key={page}
                          active={page === currentPage}
                          onClick={() => currentPage !== page && fetchProjectTaskStats(page)}
                        >
                          {page}
                        </Pagination.Item>
                      ))}
                      <Pagination.Next
                        onClick={() => currentPage < totalPages && fetchProjectTaskStats(currentPage + 1)}
                        disabled={currentPage === totalPages} style={{cursor: "pointer"}}
                      />
                    </Pagination>
                  )}
                </CRow>
                <br/>
                <div className="d-flex justify-content-end align-items-center">
                  <Button variant="primary" disabled={projectSelected === undefined? true : !projectSelected}
                          className="mb-4" onClick={() => {
                            projectCards.current.forEach(card => card.classList.remove("project-selected"));
                            setProjectSelected(null);
                          }}>
                    <FontAwesomeIcon icon={faMinus} /> Remove Selection
                  </Button>
                </div>
                <CTable align="middle" className="mb-0 border" hover responsive>
                  <CTableHead className="text-nowrap">
                    <CTableRow>
                      <CTableHeaderCell className="bg-body-tertiary text-center">
                        <CIcon icon={cilUser}/>
                      </CTableHeaderCell>
                      <CTableHeaderCell className="bg-body-tertiary">User</CTableHeaderCell>
                      <CTableHeaderCell className="bg-body-tertiary">Role</CTableHeaderCell>
                      <CTableHeaderCell className="bg-body-tertiary">Tasks Completed</CTableHeaderCell>
                      <CTableHeaderCell className="bg-body-tertiary">Total Tasks</CTableHeaderCell>
                      <CTableHeaderCell className="bg-body-tertiary">Activity</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {/* Show placeholder message if no project is selected */}
                    {!projectSelected ? (
                      <CTableRow>
                        <CTableDataCell colSpan="6">
                          <div className="d-flex justify-content-center align-items-center" style={{ height: "200px", fontSize: "1.2rem", color: "gray" }}>
                            Please select a project from above list
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    ) : loading4 ? (
                      /* Show Spinner while loading */
                      <CTableRow>
                        <CTableDataCell colSpan="6">
                          <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
                            <CSpinner color="primary" style={{ scale: "1.5" }} />
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    ) : usersList.length === 0 ? (
                      /* Show message if no users are found for the selected project */
                      <CTableRow>
                        <CTableDataCell colSpan="6">
                          <div className="d-flex justify-content-center align-items-center" style={{ height: "200px", fontSize: "1.2rem", color: "gray" }}>
                            No team members found for this project
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      /* Render users */
                      usersList.map((user, index) => (
                        <CTableRow key={index}>
                          <CTableDataCell className="text-center">
                            <CAvatar size="md" src={user.avatar} />
                          </CTableDataCell>
                          <CTableDataCell>
                            <div>{user.name}</div>
                            <div className="small text-body-secondary text-nowrap">
                              <span>{user.role}</span> | Joined: {user.createdAt? new Date(user.createdAt).toDateString().toString() : "N/A"}
                            </div>
                          </CTableDataCell>
                          <CTableDataCell>{user.role}</CTableDataCell>
                          <CTableDataCell>{user.completedTasks}</CTableDataCell>
                          <CTableDataCell>{user.totalTasks}</CTableDataCell>
                          <CTableDataCell>
                            <div className="small text-body-secondary text-nowrap">Last login</div>
                            <div className="fw-semibold text-nowrap">
                              {user.lastLogin? new Date(user.lastLogin).toDateString() : "N/A"}
                            </div>
                          </CTableDataCell>
                        </CTableRow>
                      ))
                    )}
                  </CTableBody>
                </CTable>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </>
    );
  }
};

export default Dashboard;
