import React, { useState, useEffect, useContext } from "react";
import {
  Button,
  Modal,
  Form,
  Card,
  Table,
  Pagination,
  Dropdown,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faEdit,
  faPlus,
  faCheck,
  faComment,
} from "@fortawesome/free-solid-svg-icons";
import { Back_Origin } from "../../../../Frontend_ENV";
import { AppContext } from "src/App";
import {
  CModal, CButton, CModalFooter,
  CModalHeader, CModalTitle, CModalBody, CSpinner
} from "@coreui/react";
import {useLocation} from "react-router-dom";

const ProjectView = () => {
  const { currentUser, showMessage } = useContext(AppContext);

  // -------------------------
  // GLOBAL LOADING & PAGINATION (Projects)
  // -------------------------
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const projectsPerPage = 6;

  // -------------------------
  // PROJECTS STATE & FUNCTIONS
  // -------------------------
  const [projects, setProjects] = useState([]);
  const [projectData, setProjectData] = useState({
    id: null,
    name: "",
    description: "",
    status: "active",
    createdBy: null,
    teamMembers: [],
  });
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const fetchProjects = async (page = 1, limit = 6) => {
    try {
      if (!localStorage.getItem("token")) {
        return;
      }
      if (localStorage.getItem("currentPage")) {
        page = parseInt(localStorage.getItem("currentPage"));
      }
      setLoading(true);
      setCurrentPage(page);
      const response = await fetch(`${Back_Origin}/getAllProjects?page=${page}&limit=${limit}`, {
        headers: { authorization: localStorage.getItem("token") },
      });
      const data = await response.json();
      setLoading(false);
      if (!data.error) {
        setProjects(data.data);
        setTotalPages(data.totalPages || 1);
        return data.data;
      } else {
        showMessage(data.error, true);
        return [];
      }
    } catch (error) {
      setLoading(false);
      showMessage("Failed to fetch projects", true);
      return [];
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (!projectModalVisible) {
      setProjectData({
        id: null,
        name: "",
        description: "",
        status: "active",
        createdBy: null,
        teamMembers: [],
      });
    }
  }, [projectModalVisible]);

  const addProject = async () => {
    try {
      if (!localStorage.getItem("token")) {
        return;
      }
      setProjectModalVisible(false);
      setLoading(true);
      const response = await fetch(`${Back_Origin}/addProject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify({...projectData, createdBy: currentUser?.id}),
      });
      const data = await response.json();
      await fetchProjects(1);
      setLoading(false);
      if (!data.error) {
        showMessage(data.message || "Project added successfully", false);
      } else {
        showMessage(data.error, true);
      }
    } catch (error) {
      setLoading(false);
      showMessage("Failed to add project", true);
    }
  };

  const updateProject = async () => {
    try {
      setProjectModalVisible(false);
      setLoading(true);
      const response = await fetch(
        `${Back_Origin}/updateProject/${projectData.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            authorization: localStorage.getItem("token"),
          },
          body: JSON.stringify(projectData),
        }
      );
      const data = await response.json();
      await fetchProjects(currentPage);
      setLoading(false);
      if (!data.error) {
        showMessage(data.message || "Project updated successfully", false);
      } else {
        showMessage(data.error, true);
      }
    } catch (error) {
      setLoading(false);
      showMessage("Failed to update project", true);
    }
  };

  const deleteProject = async (projectId) => {
    try {
      if (!localStorage.getItem("token")) {
        return;
      }
      setShowDeleteConfirmation(false);
      setSelectedProject(null);
      setLoading(true);
      const response = await fetch(`${Back_Origin}/deleteProject/${projectId}`, {
        method: "DELETE",
        headers: { authorization: localStorage.getItem("token") },
      });
      const data = await response.json();
      await fetchProjects(projects.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage);
      setLoading(false);
      if (!data.error) {
        showMessage(data.message || "Project deleted successfully", false);
      } else {
        showMessage(data.error, true);
      }
    } catch (error) {
      setLoading(false);
      showMessage("Failed to delete project", true);
    }
  };

  // -------------------------
  // TASKS STATE & FUNCTIONS (unchanged)
  // -------------------------
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskData, setTaskData] = useState({
    id: null,
    title: "",
    description: "",
    dueDate: "",
    priority: "",
    status: "pending",
    createdBy: null,
    assignedTo: null,
    project: null,
  });
  const [taskTableModalVisible, setTaskTableModalVisible] = useState(false);
  const [taskFormModalVisible, setTaskFormModalVisible] = useState(false);
  const [taskFormMode, setTaskFormMode] = useState("add");
  const [taskLoading, setTaskLoading] = useState(false);
  const [doneLoading, setDoneLoading] = useState({ taskId: null, loading: false });
  const [tasksCurrentPage, setTasksCurrentPage] = useState(1);
  const [tasksTotalPages, setTasksTotalPages] = useState(1);

  const fetchTasksByProject = async (projectId, page = 1, limit = 5, reload = true) => {
    try {
      setTasksCurrentPage(page);
      if (reload) setTaskLoading(true);
      const response = await fetch(
        `${Back_Origin}/getTasksByProject/${projectId}?page=${page}&limit=${limit}`,
        { headers: { authorization: localStorage.getItem("token") } }
      );
      const data = await response.json();
      if (reload) setTaskLoading(false);
      if (!data.error) {
        setTasks(data.data);
        setTasksTotalPages(data.totalPages);
      } else {
        showMessage(data.error, true);
        setTasks([]);
        setTasksTotalPages(1);
        setTasksCurrentPage(1);
      }
    } catch (error) {
      if (reload) setTaskLoading(false);
      showMessage("Failed to fetch tasks", true);
    }
  };

  const openTaskTableModal = async (project) => {
    setSelectedProject(project);
    setTaskLoading(true);
    setTaskTableModalVisible(true);
    await fetchTasksByProject(project.id, 1, 5, false);
    await fetchTeamMembers(project.id, false);
    setTaskLoading(false);
  };

  const openAddTaskModal = () => {
    setTaskData({
      id: null,
      title: "",
      description: "",
      dueDate: "",
      priority: "",
      status: "pending",
      createdBy: currentUser?.id,
      assignedTo: currentUser?.id,
      project: selectedProject ? selectedProject?.id : null,
    });
    setTaskFormMode("add");
    setTaskFormModalVisible(true);
  };

  const openEditTaskModal = (task) => {
    setTaskData(task);
    setTaskFormMode("edit");
    setTaskFormModalVisible(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setTaskFormModalVisible(false);
    setTaskLoading(true);
    if (taskData.id) {
      try {
        if (!localStorage.getItem("token")) {
          return;
        }
        const response = await fetch(`${Back_Origin}/updateTask/${taskData.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            authorization: localStorage.getItem("token"),
          },
          body: JSON.stringify({
            ...taskData,
            assignedTo: taskData?.assignedTo?.id || taskData?.assignedTo,
          }),
        });
        const data = await response.json();
        if (!data.error) {
          await fetchTasksByProject(selectedProject?.id, tasksCurrentPage);
          showMessage(data.message || "Task updated successfully", false);
        } else {
          showMessage(data.error, true);
          setTaskLoading(false);
        }
      } catch (error) {
        setTaskLoading(false);
        showMessage("Failed to update task", true);
      }
    } else {
      const newTask = {
        ...taskData,
        createdBy: currentUser?.id,
        assignedTo: taskData?.assignedTo?.id || taskData?.assignedTo,
        project: selectedProject?.id,
      };
      try {
        if (!localStorage.getItem("token")) {
          return;
        }
        const response = await fetch(`${Back_Origin}/addTask`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: localStorage.getItem("token"),
          },
          body: JSON.stringify(newTask),
        });
        const data = await response.json();
        if (!data.error) {
          await fetchTasksByProject(selectedProject?.id, tasksCurrentPage);
          showMessage(data.message || "Task added successfully", false);
        } else {
          showMessage(data.error, true);
          setTaskLoading(false);
        }
      } catch (error) {
        setTaskLoading(false);
        showMessage("Failed to add task", true);
      }
    }
    setTaskData({
      id: null,
      title: "",
      description: "",
      dueDate: "",
      priority: "",
      status: "pending",
      createdBy: null,
      assignedTo: null,
      project: null,
    });
  };

  const deleteTask = async (taskId) => {
    try {
      if (!localStorage.getItem("token")) {
        return;
      }
      setTaskLoading(true);
      const response = await fetch(`${Back_Origin}/deleteTask/${taskId}`, {
        method: "DELETE",
        headers: { authorization: localStorage.getItem("token") },
      });
      const data = await response.json();
      setTaskLoading(false);
      if (!data.error) {
        await fetchTasksByProject(selectedProject?.id, tasksCurrentPage);
        showMessage(data.message || "Task deleted successfully", false);
      } else {
        showMessage(data.error, true);
      }
    } catch (error) {
      setTaskLoading(false);
      showMessage("Failed to delete task", true);
    }
  };

  const markAsDone = async (taskId, currentStatus) => {
    try {
      if (!localStorage.getItem("token")) {
        return;
      }
      setDoneLoading({ taskId, loading: true });
      const newStatus = currentStatus === "completed" ? "in-progress" : "completed";
      const response = await fetch(`${Back_Origin}/updateTask/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!data.error) {
        await fetchTasksByProject(selectedProject?.id, tasksCurrentPage, 5, false);
        setDoneLoading({ taskId, loading: false });
      } else {
        setDoneLoading({ taskId, loading: false });
        showMessage(data.error, true);
      }
    } catch (error) {
      setDoneLoading({ taskId, loading: false });
      showMessage("Failed to update task status", true);
    }
  };

  // -------------------------
  // COMMENTS STATE & FUNCTIONS (unchanged)
  // -------------------------
  const [comments, setComments] = useState([]);
  const [commentModalState, setCommentModalState] = useState({
    visible: false,
    taskId: null,
    taskTitle: null,
    mode: "view",
  });
  const [commentData, setCommentData] = useState({
    id: null,
    content: "",
    author: currentUser?.name || "",
  });
  const [commentLoading, setCommentLoading] = useState(false);

  const viewComments = (taskId, taskTitle) => {
    setCommentModalState({
      visible: true,
      taskId,
      taskTitle,
      mode: "view",
    });
    fetchComments(taskId);
  };

  const fetchComments = async (taskId, page = 1, limit = 5) => {
    try {
      setCommentLoading(true);
      const response = await fetch(
        `${Back_Origin}/getCommentsForTask/${taskId}?page=${page}&limit=${limit}`,
        { headers: { authorization: localStorage.getItem("token") } }
      );
      const data = await response.json();
      setCommentLoading(false);
      if (!data.error) {
        setComments(data.data);
      } else {
        setComments([]);
        showMessage(data.error, true);
      }
    } catch (error) {
      setCommentLoading(false);
      setComments([]);
      showMessage("Failed to fetch comments", true);
    }
  };

  const handleCommentInputChange = (e) => {
    const { name, value } = e.target;
    setCommentData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    setCommentLoading(true);
    try {
      const urlToFetch =
        commentModalState.mode === "edit"
          ? `${Back_Origin}/updateComment/${commentData.id}`
          : `${Back_Origin}/addCommentToTask/${commentModalState.taskId}`;
      const response = await fetch(urlToFetch, {
        method: commentModalState.mode === "edit" ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify({
          content: commentData.content,
          author: currentUser?.id,
        }),
      });
      const data = await response.json();
      if (!data.error) {
        showMessage(data.message, false);
        setCommentModalState((prev) => ({ ...prev, mode: "view" }));
        fetchComments(commentModalState.taskId);
      } else {
        setCommentLoading(false);
        showMessage(data.error, true);
      }
    } catch (error) {
      setCommentLoading(false);
      showMessage("Failed to add comment", true);
    }
  };

  const handleEditComment = (commentId) => {
    const commentToEdit = comments.find((comment) => comment.id === commentId);
    setCommentData({ ...commentToEdit, author: currentUser?.name, id: commentId });
    setCommentModalState((prev) => ({ ...prev, mode: "edit" }));
  };

  const handleDeleteComment = async (commentId) => {
    try {
      if (!localStorage.getItem("token")) {
        return;
      }
      setCommentLoading(true);
      const response = await fetch(`${Back_Origin}/deleteComment/${commentId}`, {
        method: "DELETE",
        headers: { authorization: localStorage.getItem("token") },
      });
      const data = await response.json();
      setCommentLoading(false);
      if (!data.error) {
        fetchComments(commentModalState.taskId);
        showMessage(data.message, false);
      } else {
        setCommentLoading(false);
        showMessage(data.error, true);
      }
    } catch (error) {
      setCommentLoading(false);
      showMessage("Failed to delete comment", true);
    }
  };

  // -------------------------
  // TEAM MEMBERS STATE & FUNCTIONS
  // -------------------------
  const [membersModalVisible, setMembersModalVisible] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [members, setMembers] = useState([]);
  // For editing team members using a textarea with one username per line.
  const [editMembersModalVisible, setEditMembersModalVisible] = useState(false);
  const [membersText, setMembersText] = useState(""); // multi-line text of usernames
  const [membersUpdating, setMembersUpdating] = useState(false);

  const fetchTeamMembers = async (projectId, reload = true) => {
    try {
      reload && setMembersLoading(true);
      const response = await fetch(
        `${Back_Origin}/getUsersByProject/${projectId}`,
        { headers: { authorization: localStorage.getItem("token") } }
      );
      const data = await response.json();
      reload && setMembersLoading(false);
      if (!data.error) {
        setMembers(data.data);
        setMembersText(data.data.map((m) => m.username).join("\n"));
      } else {
        showMessage(data.error, true);
        setMembers([]);
        setMembersText("");
      }
    } catch (error) {
      reload && setMembersLoading(false);
      setMembers([]);
      setMembersText("");
      showMessage("Failed to fetch team members", true);
    }
  };

  const openMembersModal = async (project) => {
    setSelectedProject(project);
    setMembersModalVisible(true);
    await fetchTeamMembers(project.id);
  };

  // Open edit members modal and prefill the textarea with one username per line.
  const openEditMembersModal = () => {
    setEditMembersModalVisible(true);
  };

  // Handle immediate removal of a team member using the trash button.
  const handleRemoveMember = async (username) => {
    setMembersUpdating(true);
    // Create updated list from current members (using usernames).
    const updatedUsernames = members
      .map((m) => m.username)
      .filter((u) => u !== username);
    try {
      const response = await fetch(
        `${Back_Origin}/assignTeamMembers/${selectedProject?.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            authorization: localStorage.getItem("token"),
          },
          body: JSON.stringify({ teamMembers: updatedUsernames }),
        }
      );
      const data = await response.json();
      if (!data.error) {
        showMessage(data.message || "Team member removed successfully", false);
        await fetchTeamMembers(selectedProject?.id);
      } else {
        showMessage(data.error, true);
      }
    } catch (error) {
      showMessage("Failed to remove team member", true);
    }
    setMembersUpdating(false);
  };

  // When saving changes in the Edit Team Members modal,
  // split the textarea by newlines to get an array of usernames.
  const updateTeamMembers = async () => {
    setEditMembersModalVisible(false);
    setMembersUpdating(true);
    let usernames = membersText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    try {
      const response = await fetch(
        `${Back_Origin}/assignTeamMembers/${selectedProject?.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            authorization: localStorage.getItem("token"),
          },
          body: JSON.stringify({ teamMembers: usernames }),
        }
      );
      const data = await response.json();
      if (!data.error) {
        showMessage(data.message || "Team members updated successfully", false);
      } else {
        showMessage(data.error, true);
      }
      await fetchTeamMembers(selectedProject?.id);
    } catch (error) {
      setMembersText("");
      showMessage("Failed to update team members", true);
    }
    setMembersUpdating(false);
  };

  return (
    <div className="p-3">
      <h2 className="text-2xl font-bold mb-4">Project Manager</h2>
      <Button
        variant="primary"
        disabled={loading}
        className="mb-4"
        onClick={() => setProjectModalVisible(true)}
      >
        <FontAwesomeIcon icon={faPlus} /> Add Project
      </Button>

      {/* Projects List */}
      {!loading ? (
        <>
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {projects.map((project) => (
                <div key={project.id} className="col">
                  <Card className="h-100">
                    <Card.Body className="d-flex flex-column">
                      {
                        ((currentUser?.role === "admin" || currentUser?.role === "manager") ||
                          (project?.createdBy?.id === currentUser?.id)) && (
                          <div className="mt-2 mb-2 d-flex gap-2 flex-wrap justify-content-end">
                            <Button
                              variant="warning"
                              onClick={() => {
                                setProjectData(project);
                                setProjectModalVisible(true);
                              }}
                            >
                              <FontAwesomeIcon icon={faEdit}/>
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => {
                                setSelectedProject(project);
                                setShowDeleteConfirmation(true);
                              }}
                            >
                              <FontAwesomeIcon icon={faTrash}/>
                            </Button>
                          </div>
                        )
                      }
                      <Card.Title>
                        {project.name}
                        <span
                          style={{
                            position: "absolute",
                            top: "-15px",
                            right: "0",
                          }}
                          className={`badge bg-${
                            project.status === "active"
                              ? "primary"
                              : project.status === "completed"
                                ? "success"
                                : "warning"
                          } ms-2`}
                        >
                          {project.status}
                        </span>
                      </Card.Title>
                      <Card.Text>{project.description}</Card.Text>
                      <div className="mt-auto d-flex gap-2 flex-wrap justify-content-evenly">
                        <Button
                          variant="info"
                          onClick={() => openMembersModal(project)}
                        >
                          View Members
                        </Button>
                        <Button
                          variant="info"
                          onClick={() => openTaskTableModal(project)}
                        >
                          View Tasks
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              ))}
          </div>
          <Pagination className="mt-4 justify-content-center">
            <Pagination.Prev
              onClick={() => {
                if (currentPage > 1) {
                  localStorage.setItem("currentPage", currentPage - 1);
                  setCurrentPage((prev) => prev - 1);
                  fetchProjects(currentPage - 1);
                }
              }}
              disabled={currentPage === 1}
            />
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Pagination.Item
                key={page}
                active={page === currentPage}
                onClick={() => {
                  if (page !== currentPage) {
                    localStorage.setItem("currentPage", page);
                    setCurrentPage(page);
                    fetchProjects(page);
                  }
                }}
              >
                {page}
              </Pagination.Item>
            ))}
            <Pagination.Next
              onClick={() => {
                if (currentPage < totalPages) {
                  localStorage.setItem("currentPage", currentPage + 1);
                  setCurrentPage((prev) => prev + 1);
                  fetchProjects(currentPage + 1);
                }
              }}
              disabled={currentPage === totalPages}
            />
          </Pagination>
        </>
      ) : (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "184px" }}
        >
          <CSpinner color="primary" style={{ scale: "1.5" }} />
        </div>
      )}

      {/* Project Add/Edit Modal */}
      <Modal
        show={projectModalVisible}
        onHide={() => setProjectModalVisible(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {projectData.id ? "Edit Project" : "Add Project"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Project Name</Form.Label>
              <Form.Control
                value={projectData.name}
                onChange={(e) =>
                  setProjectData({ ...projectData, name: e.target.value })
                }
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Project Creator</Form.Label>
              <div className="form-control">{projectData?.createdBy?.name || currentUser?.name}</div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                style={{
                  maxHeight: "150px",
                }}
                value={projectData.description}
                onChange={(e) =>
                  setProjectData({
                    ...projectData,
                    description: e.target.value,
                  })
                }
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setProjectModalVisible(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={projectData.id ? updateProject : addProject}>
            {projectData.id ? "Update" : "Create"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Project Delete Confirmation Modal */}
      <CModal visible={showDeleteConfirmation} onClose={() => {
        setSelectedProject(null);
        setShowDeleteConfirmation(false);
      }}>
        <CModalHeader>
          <CModalTitle>Confirm Deletion</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Are you sure you want to delete the project: <strong>{selectedProject?.name}</strong>?
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => {
            setSelectedProject(null);
            setShowDeleteConfirmation(false);
          }}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={() => deleteProject(selectedProject?.id)}>
            Delete
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Task Table Modal */}
      <Modal
        show={taskTableModalVisible}
        onHide={() => setTaskTableModalVisible(false)}
        size="xl"
      >
        <Modal.Header closeButton>
          <Modal.Title>Tasks for {selectedProject?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Button variant="primary" className="mb-3" onClick={openAddTaskModal}>
            <FontAwesomeIcon icon={faPlus} /> Add Task
          </Button>
          {taskLoading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
              <CSpinner color="primary" style={{ scale: "1.5" }} />
            </div>
          ) : (
            <>
              <Table striped bordered hover responsive>
                <thead>
                <tr>
                  <th style={{width: "150px"}}>Title</th>
                  <th style={{width: "90px"}}>Due Date</th>
                  <th style={{width: "120px"}}>Created By</th>
                  <th style={{width: "120px"}}>Assigned To</th>
                  <th style={{width: "77px"}}>Priority</th>
                  <th style={{width: "100px"}}>Status</th>
                  <th style={{width: "152px"}}>Actions</th>
                </tr>
                </thead>
                <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}</td>
                    <td>
                      {typeof task.createdBy === "object" && task.createdBy !== null
                        ? task.createdBy.name
                        : task.createdBy}
                    </td>
                    <td>
                      {typeof task.assignedTo === "object" && task.assignedTo !== null
                        ? task.assignedTo.name
                        : task.assignedTo}
                    </td>
                    <td>{task.priority}</td>
                    <td>
                        <span className={`badge bg-${task.status === "completed" ? "success" : "warning"}`}>
                          {task.status}
                        </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          variant={task.status === "completed" ? "secondary" : "success"}
                          size="sm"
                          disabled={doneLoading.taskId === task.id && doneLoading.loading}
                          onClick={() => markAsDone(task.id, task.status)}
                        >
                          <FontAwesomeIcon icon={faCheck}/>
                        </Button>
                        <Button variant="warning" size="sm" onClick={() => openEditTaskModal(task)}>
                          <FontAwesomeIcon icon={faEdit}/>
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => deleteTask(task.id)}>
                          <FontAwesomeIcon icon={faTrash}/>
                        </Button>
                        <Button variant="info" size="sm" onClick={() => viewComments(task.id, task.title)}>
                          <FontAwesomeIcon icon={faComment}/>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No tasks found
                    </td>
                  </tr>
                )}
                </tbody>
              </Table>
              {tasksTotalPages > 1 && (
                <Pagination className="mt-3 justify-content-center">
                  <Pagination.Prev
                    onClick={() => {
                      if (tasksCurrentPage > 1)
                        fetchTasksByProject(selectedProject?.id, tasksCurrentPage - 1);
                    }}
                    disabled={tasksCurrentPage === 1}
                  />
                  {Array.from({ length: tasksTotalPages }, (_, i) => i + 1).map((page) => (
                    <Pagination.Item
                      key={page}
                      active={page === tasksCurrentPage}
                      onClick={() => {
                        if (page !== tasksCurrentPage)
                          fetchTasksByProject(selectedProject?.id, page);
                      }}
                    >
                      {page}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    onClick={() => {
                      if (tasksCurrentPage < tasksTotalPages)
                        fetchTasksByProject(selectedProject?.id, tasksCurrentPage + 1);
                    }}
                    disabled={tasksCurrentPage === tasksTotalPages}
                  />
                </Pagination>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setTaskTableModalVisible(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Task Form Modal (Add/Edit Task) */}
      <Modal show={taskFormModalVisible} onHide={() => setTaskFormModalVisible(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{taskFormMode === "edit" ? "Edit Task" : "Add Task"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleTaskSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Task Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={taskData.title}
                onChange={(e) => setTaskData({...taskData, title: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={taskData.description}
                onChange={(e) => setTaskData({...taskData, description: e.target.value})}
                required
                style={{minHeight: "100px", maxHeight: "200px"}}
              />
            </Form.Group>
            <div className="d-flex justify-content-between gap-3">
              <Form.Group className="mb-3 w-50">
                <Form.Label>Due Date</Form.Label>
                <Form.Control
                  type="date"
                  name="dueDate"
                  value={taskData.dueDate ? taskData.dueDate.split("T")[0] : ""}
                  onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3 w-50">
                <Form.Label>Assign To</Form.Label>
                <Dropdown className="w-100">
                  <Dropdown.Toggle variant="outline-secondary" className="w-100">
                    {members?.find((m) => m.id === taskData?.assignedTo?.id)?.name || "Select Member"}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="w-100">
                    {members?.map((member) => (
                      <Dropdown.Item
                        key={member?.id}
                        onClick={() => setTaskData({...taskData, assignedTo: member})}
                      >
                        {member?.name}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </Form.Group>
            </div>
            <div className="d-flex justify-content-between gap-3">
              <Form.Group className="mb-3 w-50">
                <Form.Label>Priority</Form.Label>
                <Form.Select
                  name="priority"
                  style={{cursor: "pointer"}}
                  value={taskData.priority}
                  onChange={(e) => setTaskData({...taskData, priority: e.target.value})}
                  required
                >
                  <option value="">Select Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3 w-50">
                <Form.Label>Status</Form.Label>
                <Dropdown className="w-100">
                  <Dropdown.Toggle variant="outline-secondary" className="w-100">
                    {taskData.status.charAt(0).toUpperCase() + taskData.status.slice(1)}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="w-100">
                    {["Pending", "In-progress", "Completed"].map((status) => (
                      <Dropdown.Item
                        key={status}
                        onClick={() => setTaskData({...taskData, status: status.toLowerCase()})}
                      >
                        {status}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </Form.Group>
            </div>
            <Button variant="primary" type="submit">
              {taskFormMode === "edit" ? "Save Changes" : "Add Task"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Comments Modal */}
      <Modal
        show={commentModalState.visible}
        onHide={() =>
          setCommentModalState({ ...commentModalState, visible: false, mode: "view" })
        }
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {commentModalState.mode === "add"
              ? "Add Comment"
              : commentModalState.mode === "edit"
                ? "Edit Comment"
                : "Task Comments"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {commentLoading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "184px" }}>
              <CSpinner color="primary" style={{ scale: "1.5" }} />
            </div>
          ) : commentModalState.mode === "add" || commentModalState.mode === "edit" ? (
            <Form onSubmit={handleAddComment}>
              <Form.Group className="mb-3">
                <Form.Label>Content</Form.Label>
                <Form.Control
                  as="textarea"
                  name="content"
                  value={commentData.content || ""}
                  onChange={handleCommentInputChange}
                  required
                  style={{ minHeight: "100px", maxHeight: "200px" }}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Author:</Form.Label>
                <Form.Control type="text" name="author" disabled value={commentData.author || ""} required />
              </Form.Group>
              <div className="d-flex justify-content-between">
                <Button
                  variant="danger"
                  type="button"
                  onClick={() => setCommentModalState({ ...commentModalState, mode: "view" })}
                >
                  Back
                </Button>
                <Button variant="primary" type="submit">
                  {commentModalState.mode === "edit" ? "Save Changes" : "Add Comment"}
                </Button>
              </div>
            </Form>
          ) : (
            <>
              <div className="d-flex justify-content-end mb-3">
                <Button
                  variant="primary"
                  onClick={() => {
                    setCommentData({ id: null, content: "", author: currentUser?.name });
                    setCommentModalState({ ...commentModalState, mode: "add" });
                  }}
                >
                  Add Comment
                </Button>
              </div>
              <Table striped bordered hover responsive>
                <thead>
                <tr>
                  <th>Content</th>
                  <th style={{ minWidth: "110px" }}>Author</th>
                  <th style={{ minWidth: "110px" }}>Created At</th>
                  <th style={{ minWidth: "85px" }}>Actions</th>
                </tr>
                </thead>
                <tbody>
                {comments.map((comment) => (
                  <tr key={comment.id}>
                    <td>{comment.content}</td>
                    <td>{comment.author.name}</td>
                    <td>{new Date(comment.createdAt).toLocaleDateString()}</td>
                    <td>
                      {(comment.author.id === currentUser?.id ||
                        currentUser?.role === "admin") && (
                        <div className="d-flex gap-1">
                          <Button variant="warning" size="sm" onClick={() => handleEditComment(comment.id)}>
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteComment(comment.id)}>
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {comments.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center">
                      No comments found
                    </td>
                  </tr>
                )}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* TEAM MEMBERS MODAL */}
      <Modal
        show={membersModalVisible}
        onHide={() => setMembersModalVisible(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Team Members for {selectedProject?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {(membersLoading || membersUpdating) ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
              <CSpinner color="primary" style={{ scale: "1.5" }} />
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
              <tr>
                <th style={{ minWidth: "90px" }}>Name</th>
                <th style={{ minWidth: "200px" }}>Email</th>
                <th style={{ minWidth: "72px" }}>Gender</th>
                <th style={{ minWidth: "80px" }}>Role</th>
                <th style={{ minWidth: "73px" }}>Actions</th>
              </tr>
              </thead>
              <tbody>
              {members.map((member, index) => (
                <tr key={`${member.id}-${index}`}>
                  <td style={{ overflowWrap: "anywhere" }}>{member.name}</td>
                  <td style={{ overflowWrap: "anywhere" }}>{member.email}</td>
                  <td style={{ overflowWrap: "anywhere" }}>{member.gender}</td>
                  <td style={{ overflowWrap: "anywhere" }}>{member.role}</td>
                  <td style={{ overflowWrap: "anywhere", position: "relative" }}>
                    {/* Only show the trash button if the member is NOT the project creator */}
                    {selectedProject?.createdBy?.id !== member.id && (
                      <Button
                        variant="danger"
                        className="position-absolute top-50 start-50"
                        style={{ transform: "translate(-50%, -50%)" }}
                        size="sm"
                        onClick={() => handleRemoveMember(member.username)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center">
                    No team members found
                  </td>
                </tr>
              )}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setMembersModalVisible(false)}>
            Close
          </Button>
          {(selectedProject?.createdBy?.id === currentUser?.id ||
            currentUser?.role === "admin" || currentUser?.role === "manager") && (
            <Button variant="primary" onClick={openEditMembersModal}>
              Edit Team Members
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* EDIT TEAM MEMBERS MODAL */}
      <Modal
        show={editMembersModalVisible}
        onHide={() => {
          setEditMembersModalVisible(false);
          fetchTeamMembers(selectedProject?.id);
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Team Members for {selectedProject?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Enter one username per line:</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                style={{ resize: "none", minHeight: "100px", maxHeight: "250px" }}
                value={membersText}
                onChange={(e) => {
                  // Check if Changing in creator's username
                  if (e.target.value.split("\n").includes(selectedProject?.createdBy?.username)) {
                    setMembersText(e.target.value);
                  } else {
                    showMessage("Project creator's username cannot be removed", true);
                  }
                }}
              />
            </Form.Group>
          </Form>
          <p>
            <small>
              Each line should contain one username. Press Enter between names.
              The project creator's username will be preserved.
            </small>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setEditMembersModalVisible(false);
            fetchTeamMembers(selectedProject?.id);
          }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={updateTeamMembers} disabled={membersUpdating}>
            {membersUpdating ? <CSpinner size="sm" color="light" /> : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
};

export default ProjectView;
