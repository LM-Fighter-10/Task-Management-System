import React, { useState, useEffect, useContext } from "react";
import { Button, InputGroup, FormControl, Modal, Form, Dropdown, Card, Pagination, Table } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit, faPlus, faSearch, faCheck, faTable, faThLarge } from "@fortawesome/free-solid-svg-icons";
import { AppContext } from "src/App";
import { CSpinner } from "@coreui/react";
import { v4 } from 'uuid';
import {Back_Origin} from "../../../../Frontend_ENV";

const TaskTable = () => {
  const { currentUser, showMessage } = useContext(AppContext);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [search, setSearch] = useState(null);
  const [filterPriority, setFilterPriority] = useState("");
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 855);
  const [viewMode, setViewMode] =
    useState(currentUser?.role === "admin" || isSmallScreen ? "table" : localStorage.getItem("taskViewMode") || "table");
  const [showModal, setShowModal] = useState(false);
  const [showCommentModal, setShowCommentModal] =
    useState({show: false, taskId: null, taskTitle: null, add: false, edit: false});
  const [commentData, setCommentData] = useState({
    content: null,
    author: currentUser?.name || null,
  });
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [doneLoading, setDoneLoading] = useState({});
  const [taskData, setTaskData] = useState({
    id: null,
    title: '',
    description: '',
    dueDate: '',
    priority: '',
    status: 'pending',
    createdBy: null,
    assignedTo: null
  });
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterTotalPages, setFilterTotalPages] = useState(1);
  const [commentsCurrentPage, setCommentsCurrentPage] = useState(1);
  const [commentsTotalPages, setCommentsTotalPages] = useState(1);

  const fetchTasks = async (page= 1, limit = 5, search = null, priority = null) => {
    try {
      if (!localStorage.getItem("token")) {
        return;
      }
      setCurrentPage(page);
      setLoading(true);
      const response = await
        fetch(`${Back_Origin}/assignedOrCreatedByUser/${currentUser?.id}`+
          `?page=${page}&limit=${limit}&search=${search}&priority=${priority}`, {
          headers: {
            'authorization': `${localStorage.getItem('token')}`
          }
        });
      const data = await response.json();
      setLoading(false);
      if (!data.error) {
        setTasks(data.data);
        setTotalPages(data.totalPages);
      } else {
        showMessage(data.error, true);
      }
    } catch (error) {
      setLoading(false);
      showMessage("An unexpected error occurred", true);
    }
  };

  useEffect(() => {
    currentUser && fetchTasks();
    // Detect screen size changes and update state
    const handleResize = () => {
      const smallScreen = window.innerWidth <= 1170;
      setIsSmallScreen(smallScreen);
      if (smallScreen) {
        setViewMode("card"); // Force card view on small screens
      } else {
        setViewMode(localStorage.getItem("taskViewMode") || "table");
      }
    };

    // Set initial state and add event listener
    handleResize();
    window.addEventListener("resize", handleResize);

    // Cleanup on unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setFilterTotalPages(totalPages);
    setFilteredTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    fetchTasks(1, 5, search, filterPriority);
  }, [filterPriority]);

  useEffect(() => {
    fetchTasks(1, 5, search, filterPriority);
  }, [search]);

  useEffect(() => {
    if (localStorage.getItem("taskViewMode") !== viewMode && currentUser?.role !== "admin" && !isSmallScreen) {
      localStorage.setItem("taskViewMode", viewMode);
    }
  }, [viewMode]);

  useEffect(() => {
    if (showCommentModal.show) {
      fetchComments(showCommentModal.taskId);
    }
  }, [showCommentModal]);


  const markAsDone = async (taskId, status) => {
    try {
      if (!localStorage.getItem("token")) {
        return;
      }
      setDoneLoading({taskId, loading: true});
      const response = await fetch(`${Back_Origin}/updateTask/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: status })
      });
      const data = await response.json();
      setDoneLoading({taskId, loading: false});
      if (!data.error) {
        setTasks((prev) => prev.map(task => {
          if (task.id === taskId) {
            task.status = (task.status === "completed") ? "in-progress" : "completed";
          }
          return task;
        }));
      } else {
        showMessage(data.error, true);
      }
    } catch (error) {
      setDoneLoading({taskId, loading: false});
      showMessage("An unexpected error occurred", true);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTaskData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowModal(false);
    setLoading(true);
    if (taskData?.id) {
      // Update existing task
      try {
        if (!localStorage.getItem("token")) {
          return;
        }
        const response = await fetch(`${Back_Origin}/updateTask/${taskData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'authorization': `${localStorage.getItem('token')}`
          },
          body: JSON.stringify(taskData)
        });
        const data = await response.json();
        if (!data.error) {
          fetchTasks(currentPage, 5, search, filterPriority);
        } else {
          showMessage(data.error, true);
        }
      } catch (e) {
        setLoading(false);
        showMessage("An unexpected error occurred", true);
      }
    } else {
      // Add new task
      const newTask = { ...taskData, createdBy: currentUser?.id, assignedTo: currentUser?.id };
      try {
        if (!localStorage.getItem("token")) {
          return;
        }
        const response = await fetch(`${Back_Origin}/addTask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authorization': `${localStorage.getItem('token')}`
          },
          body: JSON.stringify(newTask)
        });
        const data = await response.json();
        if (!data.error) {
          fetchTasks(1, 5, search, filterPriority);
        } else {
          showMessage(data.error, true);
        }
      } catch (e) {
        setLoading(false);
        showMessage("An unexpected error occurred", true);
      }
    }
    setTaskData({ id: null, title: '', description: '', dueDate: '', priority: '',
                        status: 'pending', createdBy: null, assignedTo: null });
  };

  const editTask = (taskId) => {
    const taskToEdit = tasks.find(task => task.id === taskId);
    setTaskData(taskToEdit);
    setShowModal(true);
  };

  const deleteTask = async (taskId) => {
    try {
      if (!localStorage.getItem("token")) {
        return;
      }
      setLoading(true);
      const response = await fetch(`${Back_Origin}/deleteTask/${taskId}`, {
        method: 'DELETE',
        headers: {
          'authorization': `${localStorage.getItem('token')}`
        }
      });
      const data = response.json();
      setLoading(false);
      if (!data.error) {
        setTasks((prevState) => prevState.filter(task => task.id !== taskId));
        showMessage(data.message, false);
      } else {
        showMessage(data.error, true);
      }
    } catch (error) {
      setLoading(false);
      showMessage("An unexpected error occurred", true);
    }
  };

  const handleCommentInputChange = (e) => {
    const { name, value } = e.target;
    setCommentData(prev => ({ ...prev, [name]: value }));
  }

  const handleAddComment = async (e, taskId) => {
    e.preventDefault();
    setCommentLoading(true);
    try {
      const urlToFetch =
        showCommentModal.edit? `${Back_Origin}/updateComment/${commentData.id}`
          : `${Back_Origin}/addCommentToTask/${taskId}`;
      const response = await fetch(urlToFetch, {
        method: showCommentModal.edit? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: commentData.content,
          author: currentUser?.id,
        })
      });
      const data = await response.json();
      if (!data.error) {
        showMessage(data.message, false);
        setShowCommentModal(prev => ({...prev, add: false, show: true, edit: false}));
      } else {
        setCommentLoading(false);
        showMessage(data.error, true);
      }
    } catch (error) {
      setCommentLoading(false);
      showMessage("An unexpected error occurred", true);
    }
  }

  const handleEditComment = (commentId) => {
    const commentToEdit = comments.find(comment => comment.id === commentId);
    setCommentData({ ...commentToEdit, author: currentUser?.name, id: commentId });
    setShowCommentModal(prev => ({...prev, edit: true, add: false}));
  }

  const handleDeleteComment = async (commentId) => {
    try {
      if (!localStorage.getItem("token")) {
        return;
      }
      setCommentLoading(true);
      const response = await fetch(`${Back_Origin}/deleteComment/${commentId}`, {
        method: 'DELETE',
        headers: {
          'authorization': `${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setCommentLoading(false);
      if (!data.error) {
        fetchComments(showCommentModal.taskId, 1, 5);
        showMessage(data.message, false);
      } else {
        setCommentLoading(false);
        showMessage(data.error, true);
      }
    } catch (error) {
      setCommentLoading(false);
      showMessage("An unexpected error occurred", true);
    }
  }

  const viewComments = (taskId, taskTitle) => {
    setShowCommentModal(prev =>
      ({...prev, show: true, add: false, taskId, taskTitle, edit: false})
    );
  }

  const fetchComments = async (taskId, page = 1, limit = 5) => {
    try {
      if (!localStorage.getItem("token")) {
        return;
      }
      setCommentLoading(true);
      setCommentsCurrentPage(page);
      const response = await fetch(`${Back_Origin}/getCommentsForTask/${taskId}?page=${page}&limit=${limit}`, {
        headers: {
          'authorization': `${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setCommentLoading(false);
      if (!data.error) {
        setComments(data.data);
        setCommentsTotalPages(data.totalPages);
      } else {
        setComments([]);
        showMessage(data.error, true);
      }
    } catch (error) {
      setCommentLoading(false);
      setComments([]);
      showMessage("An unexpected error occurred", true);
    }
  }

  return (
    <div className="p-3 p-md-4 p-lg-5">
      {
        currentUser?.role === "admin" ? (
          <>
            <div className="d-flex justify-content-between mb-3">
              <h2 className="h4 h-md-3 h-lg-2 font-bold mb-0">Task Manager</h2>
              <div>
                <Button variant="primary" className="flex-grow-1 w-100 me-2" onClick={() => setShowModal(true)}>
                  <FontAwesomeIcon icon={faPlus} className="me-1"/>
                  Add Task
                </Button>
              </div>
            </div>

            {/* Controls */}
            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2 mb-3">
              <div className="d-flex align-items-center w-100 w-md-auto">
                <Form.Label className="me-2 mb-0">Filter:</Form.Label>
                <Form.Select
                  value={filterPriority} style={{cursor: "pointer"}}
                  onChange={(e) => setFilterPriority(e.target.value)}>
                  <option value="">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </Form.Select>
              </div>
              <InputGroup className="flex-grow-1">
                <InputGroup.Text>
                  <FontAwesomeIcon icon={faSearch}/>
                </InputGroup.Text>
                <FormControl
                  placeholder="Search tasks by Name..."
                  value={search || ""}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </div>
          </>
        ) : (
          <>
            <h2 className="h4 h-md-3 h-lg-2 font-bold mb-3">Task Manager</h2>
            {/* Controls */}
            <div className="d-flex flex-column flex-md-row justify-content-between mb-3 gap-2">
              <Button variant="primary" className="flex-grow-1 w-100" onClick={() => setShowModal(true)}>
                <FontAwesomeIcon icon={faPlus} className="me-1"/>
                Add Task
              </Button>

              <InputGroup className="flex-grow-1">
                <InputGroup.Text>
                  <FontAwesomeIcon icon={faSearch}/>
                </InputGroup.Text>
                <FormControl
                  placeholder="Search tasks by Name..."
                  value={search || ""}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </div>

            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2 mb-3">
              <div className="d-flex align-items-center w-100 w-md-auto">
                <Form.Label className="me-2 mb-0">Filter:</Form.Label>
                <Form.Select
                  value={filterPriority} style={{cursor: "pointer"}}
                  onChange={(e) => setFilterPriority(e.target.value)}>
                  <option value="">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </Form.Select>
              </div>

              {
                !isSmallScreen && <Dropdown className="ms-md-3 w-100 w-md-auto">
                  <Dropdown.Toggle variant="outline-secondary" className="w-100">
                    <FontAwesomeIcon icon={viewMode === "table" ? faTable : faThLarge}/>{" "}
                    {viewMode === "table" ? "Table" : "Cards"}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="w-100">
                    <Dropdown.Item onClick={() => {
                      setViewMode("table");
                    }}>
                      <FontAwesomeIcon icon={faTable}/> Table
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => {
                      setViewMode("card");
                    }}>
                      <FontAwesomeIcon icon={faThLarge}/> Cards
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              }
            </div>
          </>
        )
      }

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => {
        setShowModal(false);
        setTaskData({
          id: null, title: '', description: '',
          dueDate: '', priority: '', status: 'pending',
          createdBy: null, assignedTo: null
        });
      }}>
        <Modal.Header closeButton>
          <Modal.Title>{taskData.id ? 'Edit Task' : 'Add Task'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Task Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={taskData.title}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={taskData.description}
                onChange={handleInputChange}
                required
                style={{ minHeight: '100px', maxHeight: '200px' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Due Date</Form.Label>
              <Form.Control
                type="date"
                name="dueDate"
                value={taskData?.dueDate?.split("T")[0]}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <div className="d-flex justify-content-between gap-3">
              <Form.Group className="mb-3 w-50">
                <Form.Label>Priority</Form.Label>
                <Form.Select
                  name="priority"
                  style={{cursor: "pointer"}}
                  value={taskData.priority}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3 d-flex align-items-end justify-content-center w-50">
                <Dropdown className="w-100 w-md-auto">
                  <Dropdown.Toggle variant="outline-secondary" className="w-100">
                    {taskData.status.charAt(0).toUpperCase() + taskData.status.slice(1)}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="w-100">
                    {
                      ['Pending', 'In-progress', 'Completed'].map(status => (
                        <Dropdown.Item key={status} onClick={() => {
                          setTaskData(prev => ({ ...prev, status: status.toLowerCase() }));
                        }}>
                          {status}
                        </Dropdown.Item>
                      ))
                    }
                  </Dropdown.Menu>
                </Dropdown>
              </Form.Group>
            </div>
            <Button variant="primary" type="submit">
              {taskData.id ? 'Save Changes' : 'Add Task'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Comments Modal */}
      <Modal show={showCommentModal.add || showCommentModal.show || showCommentModal.edit} onHide={() => {
        setShowCommentModal({show: false, taskId: null, taskTitle: null, add: false, edit: false});
        setCommentData({content: null, author: currentUser?.name});
      }}>
        <Modal.Header closeButton>
          <Modal.Title>
            {showCommentModal.add? "Add Comment" : showCommentModal.edit? "Edit Comment" : "Task Comments"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {
            commentLoading? (
              <div className="d-flex justify-content-center align-items-center" style={{height: "184px"}}>
                <CSpinner color="primary" style={{scale: '1.5'}}/>
              </div>
            ) : showCommentModal.add || showCommentModal.edit? (
              <Form onSubmit={(e) => handleAddComment(e, showCommentModal.taskId)}>
                <Form.Group className="mb-3">
                  <Form.Label>Content</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="content"
                    value={commentData.content || ""}
                    onChange={handleCommentInputChange}
                    required
                    style={{ minHeight: '100px', maxHeight: '200px' }}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Author: </Form.Label>
                  <Form.Control
                    type="text"
                    name="author"
                    disabled={true}
                    value={commentData.author || ""}
                    onChange={handleCommentInputChange}
                    required
                  />
                </Form.Group>
                <div className="d-flex justify-content-between">
                  <Button variant="danger" type="button" style={{color: "white"}} onClick={() => {
                    setShowCommentModal(prev => ({...prev, add: false, edit: false, show: true}));
                  }}>
                    Back
                  </Button>
                  {
                    showCommentModal.edit? (
                      <Button variant="primary" type="submit">
                        Save Changes
                      </Button>
                    ) : (
                      <Button variant="primary" type="submit">
                        Add Comment
                      </Button>
                    )
                  }
                </div>
              </Form>
            ) : (
              <>
                <div className="d-flex justify-content-end mb-3">
                  <Button variant="primary" onClick={() => {
                    setCommentData({content: null, author: currentUser?.name});
                    setShowCommentModal(prev => ({...prev, add: true, show: false, edit: false}));
                  }}>
                    Add Comment
                  </Button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Content</th>
                        <th>Author</th>
                        <th>Created At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comments.map(comment => (
                        <tr key={comment.id}>
                          <td>{comment.content}</td>
                          <td>{comment.author.name}</td>
                          <td>{new Date(comment.createdAt).toDateString().split(" ").slice(1).join(" ")}</td>
                          {
                            (comment.author.id === currentUser?.id || currentUser?.role === "admin") && (
                              <td>
                                <div className="d-flex gap-1 justify-content-evenly">
                                  <Button variant="warning" size="sm" onClick={() => handleEditComment(comment.id)}>
                                    <FontAwesomeIcon icon={faEdit}/>
                                  </Button>
                                  <Button variant="danger" size="sm" onClick={() => handleDeleteComment(comment.id)}>
                                    <FontAwesomeIcon icon={faTrash}/>
                                  </Button>
                                </div>
                              </td>
                            )
                          }
                        </tr>
                      ))}
                      {
                        comments.length === 0 && (
                          <tr>
                            <td colSpan="4" className="text-center">No comments found</td>
                          </tr>
                        )
                      }
                    </tbody>
                  </Table>
                </div>
                {commentsTotalPages > 0 && (
                  <Pagination className="mt-3 justify-content-center">
                    <Pagination.Prev
                      onClick={() => commentsCurrentPage > 1 && fetchComments(showCommentModal.taskId, commentsCurrentPage - 1, 5)}
                      disabled={commentsCurrentPage === 1} style={{ cursor: "pointer" }}
                    />
                    {Array.from({ length: commentsTotalPages }, (_, i) => i + 1).map(page => (
                      <Pagination.Item
                        key={page}
                        active={page === commentsCurrentPage}
                        onClick={() => commentsCurrentPage !== page && fetchComments(showCommentModal.taskId, page, 5)}
                      >
                        {page}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next
                      onClick={() => commentsCurrentPage < commentsTotalPages && fetchComments(showCommentModal.taskId, commentsCurrentPage + 1, 5)}
                      disabled={commentsCurrentPage === commentsTotalPages} style={{ cursor: "pointer" }}
                    />
                  </Pagination>
                )}
              </>
            )
          }
        </Modal.Body>
      </Modal>

      {/* Tasks Display */}
      {
        loading? (
          <div className="d-flex justify-content-center align-items-center"
               style={{height: "250px", borderRadius: "20px", background: "#80808014"}}>
            <CSpinner color="primary" style={{scale: '1.5'}}/>
          </div>
        ) : (
          viewMode === "table" ? (
            <div className="card mt-3">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="bg-light">
                    <tr>
                      <th style={{width: "250px"}}>Task Name</th>
                      <th style={{width: "250px"}}>Description</th>
                      <th style={{minWidth: "120px"}}>Created At</th>
                      <th style={{minWidth: "120px"}}>Due Date</th>
                      <th style={{minWidth: "80px"}}>Priority</th>
                      <th style={{minWidth: "80px"}}>Status</th>
                      <th style={{minWidth: "130px"}}>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredTasks.map(task => (
                      <tr key={task.id}>
                        <td>{task.title}</td>
                        <td>{task.description}</td>
                        <td>{new Date(task.createdAt).toDateString().split(" ").slice(1).join(" ")}</td>
                        <td>{new Date(task.dueDate).toDateString().split(" ").slice(1).join(" ")}</td>
                        <td>
                          <span
                            className={`badge bg-${task.priority.toLowerCase() === 'high' ? 'danger' : task.priority.toLowerCase() === 'medium' ? 'warning' : 'secondary'}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`badge bg-${task.status === "completed" ?
                            'success' : task.status === "in-progress" ? 'warning' : 'danger'}`}>
                            {task.status}
                          </span>
                        </td>
                        <td style={{verticalAlign: "middle"}}>
                          <div className="d-flex flex-column justify-content-center gap-2">
                            <div className="d-flex gap-1 flex-wrap justify-content-evenly">
                              <Button
                                variant={task.status === "completed" ? "secondary" : "success"}
                                size="sm"
                                disabled={doneLoading.taskId === task.id ? doneLoading.loading : false}
                                onClick={() => markAsDone(task.id,
                                  task.status === "completed" ? "in-progress" : "completed")}
                              >
                                <FontAwesomeIcon icon={faCheck}/>
                              </Button>
                              {task.status !== "completed" && (
                                <Button
                                  variant="warning"
                                  size="sm"
                                  onClick={() => editTask(task.id)}
                                >
                                  <FontAwesomeIcon icon={faEdit}/>
                                </Button>
                              )}
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => deleteTask(task.id)}
                              >
                                <FontAwesomeIcon icon={faTrash}/>
                              </Button>
                            </div>
                            <div className="my-3 d-flex justify-content-center" style={{minWidth: "130px"}}>
                              <Button
                                variant="primary"
                                size="sm"
                                style={{fontSize: "0.875rem"}}
                                onClick={() => viewComments(task.id, task.title)}
                              >
                                View Comments
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
                {filteredTasks.length === 0 && (
                  <div className="text-center p-4 text-muted">No tasks found</div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                {filteredTasks.map(task => (
                  <div key={task.id} className="col">
                    <Card className="h-100">
                      <Card.Body>
                        <Card.Title className="h6 mb-2">{task.title}</Card.Title>
                        <Card.Text className="small text-muted d-none d-md-block">
                          {task.description}
                        </Card.Text>
                        <div className="d-flex flex-wrap gap-2 mb-3 justify-content-center">
                          <span className="badge bg-primary">
                            Created: {new Date(task.createdAt).toDateString().split(" ").slice(1).join(" ")}
                          </span>
                          <span className="badge bg-primary">
                            Due: {new Date(task.dueDate).toDateString().split(" ").slice(1).join(" ")}
                          </span>
                        </div>
                        <div className="d-flex gap-2 flex-wrap mb-3 justify-content-center">
                          <span
                            className={`badge bg-${task.priority.toLowerCase() === 'high' ? 'danger' : task.priority.toLowerCase() === 'medium' ? 'warning' : 'secondary'}`}>
                            {task.priority}
                          </span>
                          <span className={`badge bg-${task.status === "completed" ? 'success' : 'danger'}`}>
                            {task.status}
                          </span>
                        </div>
                        <div className="d-flex gap-2 flex-wrap mb-2">
                          <Button
                            variant={task.status === "completed" ? "secondary" : "success"}
                            size="sm"
                            className="flex-grow-1"
                            disabled={doneLoading.taskId === task.id ? doneLoading.loading : false}
                            onClick={() => markAsDone(task.id,
                              task.status === "completed" ? "in-progress" : "completed")}
                          >
                            <FontAwesomeIcon icon={faCheck} className="me-1"/>
                            {task.status === "completed" ? "Undo" : "Complete"}
                          </Button>
                        </div>
                        <div className="d-flex gap-2 flex-wrap mb-2">
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-grow-1"
                            style={{fontSize: "0.875rem"}}
                            onClick={() => viewComments(task.id, task.title)}
                          >
                            View Comments
                          </Button>
                        </div>
                        <div className="d-flex gap-2 flex-wrap">
                          {task.status !== "completed" && (
                            <Button
                              variant="warning"
                              size="sm"
                              className="flex-grow-1"
                              onClick={() => editTask(task.id)}
                            >
                              <FontAwesomeIcon icon={faEdit}/>
                            </Button>
                          )}
                          <Button
                            variant="danger"
                            size="sm"
                            className="flex-grow-1"
                            onClick={() => deleteTask(task.id)}
                          >
                            <FontAwesomeIcon icon={faTrash}/>
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                ))}
              </div>
              {filteredTasks.length === 0 && (
                <div className="text-center p-4 text-muted">No tasks found</div>
              )}
            </div>
          )
        )
      }

      {/* Pagination */}
      {filterTotalPages > 0 && (
        <Pagination className="mt-3 justify-content-center">
          <Pagination.Prev
            onClick={() => currentPage > 1 && fetchTasks(currentPage - 1, 5, search, filterPriority)}
            disabled={currentPage === 1} style={{ cursor: "pointer" }}
          />
          {Array.from({ length: filterTotalPages }, (_, i) => i + 1).map(page => (
            <Pagination.Item
              key={page}
              active={page === currentPage}
              onClick={() => currentPage !== page && fetchTasks(page, 5, search, filterPriority)}
            >
              {page}
            </Pagination.Item>
          ))}
          <Pagination.Next
            onClick={() => currentPage < filterTotalPages && fetchTasks(currentPage + 1, 5, search, filterPriority)}
            disabled={currentPage === filterTotalPages} style={{ cursor: "pointer" }}
          />
        </Pagination>
      )}
    </div>
  );
}

export default TaskTable;
