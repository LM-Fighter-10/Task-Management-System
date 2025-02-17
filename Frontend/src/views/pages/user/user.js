import React, { useState, useEffect } from 'react';
import {
  CCard,
  CCardHeader,
  CCardBody,
  CCardFooter,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormLabel,
  CFormInput,
  CFormSelect,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPencil, cilTrash } from '@coreui/icons';
import { Back_Origin } from '../../../../../Frontend_ENV'; // adjust this path as needed
import { CSpinner } from '@coreui/react';
import {AppContext} from "src/App";

const UserManagement = () => {
  // States for users, pagination, search & filter.
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const itemsPerPage = 5;

  // States for modals and selected user.
  const [validator, setValidator] = useState({
    name: '',
    username: '',
    email: '',
    gender: '',
    password: '',
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // New user state (for adding)
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    email: '',
    gender: '',
    role: 'user',
    password: '',
    confirmPassword: '',
  });

  const { showMessage } = React.useContext(AppContext);

  // *******************************************
  // Validation helper functions:
  // *******************************************

  const emailAcceptance = (email) => {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const usernameAcceptance = (username) => {
    if (username.length < 4) return { isValid: false, error: "Username must be at least 4 characters" };
    if (!/[a-z]/.test(username)) return { isValid: false, error: "Username must include a lowercase letter" };
    if (!/^[a-z0-9_\-]+$/.test(username)) return { isValid: false, error: "Username can only contain a-z, 0-9, underscores or dashes" };
    return { isValid: true, error: null };
  };

  // *******************************************
  // Fetch users from backend.
  // The backend API should support pagination and (optionally) filtering.
  // *******************************************
  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      setCurrentPage(page);
      // Build URL with query parameters.
      let url = `${Back_Origin}/getUsers?page=${page}&limit=${itemsPerPage}`;
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      if (selectedRole && selectedRole !== 'all') {
        url += `&role=${encodeURIComponent(selectedRole)}`;
      }
      const response = await fetch(url, {
        headers: { authorization: localStorage.getItem('token') },
      });
      const result = await response.json();
      setLoading(false);
      if (!result.error) {
        setUsers(result.data.users);
        setTotalPages(result.data.totalPages);
        setTotalDocs(result.data.totalDocs);
        setCurrentPage(parseInt(result.data.currentPage, 10));
      } else {
        showMessage(result.error, true);
      }
    } catch (error) {
      setLoading(false);
      showMessage("Failed to fetch users", true);
    }
  };

  // Fetch users on component mount and when search or role changes.
  useEffect(() => {
    fetchUsers(1);
  }, [searchTerm, selectedRole]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchUsers(newPage);
    }
  };

  const validateFields = (e, type = "Add") => {
    // validate name, username, email, gender, password, confirmPassword
    let name = e.target.name, value = e.target.value;
    // Name validation
    if (name === 'name' && value.trim() && !isNaN(value)) {
      setValidator({ ...validator, name: 'Name cannot be a number' });
    } else if (name === 'name' && value.trim() && value.length < 3) {
      setValidator({ ...validator, name: 'Name must be at least 3 characters' });
    } else if (name === 'name' && value.trim() && value.length > 30) {
      setValidator({ ...validator, name: 'Name must not exceed 50 characters' });
    } else if (name === 'name' && ((value.trim() && isNaN(value)) || !value.trim())) {
      setValidator({ ...validator, name: '' });
    }
    // Username validation
    if (name === 'username' && value.trim() && value.length < 4) {
      setValidator({ ...validator, username: 'Username must be at least 4 characters' });
    } else if (name === 'username' && value.trim() && !/^[a-z0-9_\-]+$/.test(value)) {
      setValidator({ ...validator, username: 'Username can only contain a-z, 0-9, underscores or dashes' });
    } else if (name === 'username' && ((value.trim() && /^[a-z0-9_\-]+$/.test(value)) || !value.trim())) {
      setValidator({ ...validator, username: '' });
    }
    // Email validation
    if (name === 'email' && value.trim() && !emailAcceptance(value)) {
      setValidator({ ...validator, email: 'Invalid email address' });
    } else if (name === 'email' && ((value.trim() && emailAcceptance(value)) || !value.trim())) {
      setValidator({ ...validator, email: '' });
    }

    // Gender validation
    if (name === "gender" && !value.trim()) {
      setValidator({ ...validator, gender: 'Gender is required' });
    } else if (name === "gender" && value.trim()) {
      setValidator({ ...validator, gender: '' });
    }

    // Password validation
    if (name === 'password' && value.trim() && value.length < 6) {
      setValidator({ ...validator, password: 'Password must be at least 6 characters' });
    } else if (name === 'password' && value.trim() && value.length > 20) {
      setValidator({ ...validator, password: 'Password must not exceed 20 characters' });
    } else if (name === 'password' && ((value.trim() && value.length >= 6 && value.length <= 20) || !value.trim())) {
      setValidator({ ...validator, password: '' });
    }
    if (type === "Add") {
      // Confirm password validation
      if (name === 'confirmPassword' && newUser.password && value.trim() && value !== newUser.password) {
        setValidator({ ...validator, confirmPassword: 'Passwords do not match' });
      } else if (name === 'confirmPassword' && ((value.trim() && value === newUser.password) || !value.trim())) {
        setValidator({ ...validator, confirmPassword: '' });
      }
    } else {
      // Confirm password validation
      if (name === 'confirmPassword' && selectedUser.password && value.trim() && value !== selectedUser.password) {
        setValidator({ ...validator, confirmPassword: 'Passwords do not match' });
      } else if (name === 'confirmPassword' && ((value.trim() && value === selectedUser.password) || !value.trim())) {
        setValidator({ ...validator, confirmPassword: '' });
      }
    }
  }

  const handleAddInputChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
    validateFields(e, "Add");
  }

  const handleEditInputChange = (e) => {
    setSelectedUser({ ...selectedUser, [e.target.name]: e.target.value });
    validateFields(e, "Edit");
  }

  // *******************************************
  // API call to add a user
  // *******************************************
  const handleAddUser = async () => {
    if (!newUser.name) {
      setValidator({ ...validator, name: 'Name is required' });
      return;
    } else if (!newUser.username) {
      setValidator({ ...validator, username: 'Username is required' });
      return;
    } else if (!newUser.email) {
      setValidator({ ...validator, email: 'Email is required' });
      return;
    } else if (!newUser.gender) {
      setValidator({ ...validator, gender: 'Gender is required' });
      return;
    } else if (!newUser.password) {
      setValidator({ ...validator, password: 'Password is required' });
      return;
    } else if (!newUser.confirmPassword) {
      setValidator({ ...validator, confirmPassword: 'Confirm Password is required' });
      return;
    }
    for (let error of Object.values(validator)) {
      if (error) {
        showMessage(error, true);
        return;
      }
    }
    try {
      if (!localStorage.getItem("token")) {
        return;
      }
      setModalLoading(true);
      const response = await fetch(`${Back_Origin}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: localStorage.getItem('token'),
        },
        body: JSON.stringify(newUser),
      });
      const result = await response.json();
      setModalLoading(false);
      if (!result.error) {
        setLoading(true);
        setShowAddUserModal(false);
        // Reset newUser state.
        setNewUser({
          name: '',
          username: '',
          email: '',
          gender: '',
          role: 'user',
          password: '',
          confirmPassword: '',
        });
        await fetchUsers(currentPage);
      } else {
        showMessage(result.error, true);
      }
      setLoading(false);
    } catch (error) {
      setModalLoading(false);
      setLoading(false);
      showMessage("Failed to add user", true);
    }
  };

  // *******************************************
  // API call to update a user
  // *******************************************
  const handleEditUser = async () => {
    if (!selectedUser.name) {
      setValidator({ ...validator, name: 'Name is required' });
      return;
    } else if (!selectedUser.username) {
      setValidator({ ...validator, username: 'Username is required' });
      return;
    } else if (!selectedUser.email) {
      setValidator({ ...validator, email: 'Email is required' });
      return;
    } else if (!selectedUser.gender) {
      setValidator({ ...validator, gender: 'Gender is required' });
      return;
    } else if (selectedUser.password && !selectedUser.confirmPassword) {
      setValidator({ ...validator, confirmPassword: 'Confirm Password is required' });
      return;
    } else if (!selectedUser.password && selectedUser.confirmPassword) {
      setValidator({ ...validator, password: 'Password is required' });
      return;
    }
    for (let error of Object.values(validator)) {
      if (error) {
        showMessage(error, true);
        return;
      }
    }

    try {
      if (!localStorage.getItem("token")) {
        return;
      }
      setModalLoading(true);
      const response = await fetch(`${Back_Origin}/updateUser/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          authorization: localStorage.getItem('token'),
        },
        body: JSON.stringify(selectedUser),
      });
      const result = await response.json();
      setModalLoading(false);
      if (!result.error) {
        setShowEditUserModal(false);
        setSelectedUser(null);
        setLoading(true);
        await fetchUsers(currentPage);
      } else {
        showMessage(result.error, true);
      }
      setLoading(false);
    } catch (error) {
      setModalLoading(false);
      setLoading(false);
      showMessage("Failed to update user", true);
    }
  };

  // *******************************************
  // API call to delete a user
  // *******************************************
  const handleDeleteUser = async () => {
    try {
      if (!localStorage.getItem("token")) {
        return;
      }
      setShowDeleteConfirmation(false);
      setLoading(true);
      const response = await fetch(`${Back_Origin}/deleteUser/${selectedUser.id}`, {
        method: 'DELETE',
        headers: { authorization: localStorage.getItem('token') },
      });
      const result = await response.json();
      if (!result.error) {
        await fetchUsers(currentPage);
      } else {
        showMessage(result.error, true);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showMessage("Failed to delete user", true);
    }
  };

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader>
          <div className="d-flex justify-content-between align-items-center mb-3 mx-2">
            <div>
              <h5 className="mb-0">User Management</h5>
              <small className="text-body-secondary">
                Displaying {users.length} users
              </small>
            </div>
            <CButton color="primary" onClick={() => setShowAddUserModal(true)}>
              Add User
            </CButton>
          </div>
          <div className="row g-3 justify-content-between align-items-center">
            <div className="col-md-6 d-flex align-items-center">
              <CFormLabel className="form-label mx-2">Search:</CFormLabel>
              <CFormInput
                type="text"
                placeholder="Search by name, username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <CFormSelect
                style={{ cursor: "pointer" }}
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="manager">Manager</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </CFormSelect>
            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          {loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
              <CSpinner color="primary" style={{ scale: "1.5" }} />
            </div>
          ) : (
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Name</CTableHeaderCell>
                  <CTableHeaderCell>Username</CTableHeaderCell>
                  <CTableHeaderCell>Email</CTableHeaderCell>
                  <CTableHeaderCell>Role</CTableHeaderCell>
                  <CTableHeaderCell>Registered</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {users.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan="6" className="text-center">
                      No users found
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  users.map((user) => (
                    <CTableRow key={user.id}>
                      <CTableDataCell>{user.name}</CTableDataCell>
                      <CTableDataCell>{user.username}</CTableDataCell>
                      <CTableDataCell>{user.email}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={
                          user.role === 'manager'
                            ? 'warning'
                            : user.role === 'admin'
                              ? 'danger'
                              : 'primary'
                        }>
                          {user.role}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        {user.createdAt ? new Date(user.createdAt).toDateString() : 'N/A'}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton
                          color="primary"
                          variant="outline"
                          size="sm"
                          className="me-2"
                          onClick={() => {
                            setSelectedUser(user);
                            setValidator({
                              name: '',
                              username: '',
                              email: '',
                              gender: '',
                              password: '',
                            })
                            setShowEditUserModal(true);
                          }}
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton
                          color="danger"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteConfirmation(true);
                          }}
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>

        <CCardFooter className="d-flex justify-content-between align-items-center">
          <div>
            Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, totalDocs)} of {totalDocs} results
          </div>
          <div className="d-flex align-items-center">
            <CButton
              color="secondary"
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </CButton>
            <span className="mx-2">
              Page {currentPage} of {totalPages}
            </span>
            <CButton
              color="secondary"
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </CButton>
          </div>
        </CCardFooter>
      </CCard>

      {/* Add User Modal */}
      <CModal visible={showAddUserModal} onClose={() => {
        setShowAddUserModal(false);
        setNewUser({
          name: '',
          username: '',
          email: '',
          gender: '',
          role: 'user',
          password: '',
          confirmPassword: '',
        });
      }}>
        <CModalHeader>
          <CModalTitle>Add New User</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {
            !modalLoading ? (
              <CForm className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between mb-3 mt-3 gap-2">
                  <div className="w-50">
                    <CFormLabel>Full Name</CFormLabel>
                    <CFormInput
                      type="text"
                      required
                      className={validator.name ? 'is-invalid' : ''}
                      value={newUser.name}
                      name="name"
                      onChange={handleAddInputChange}
                    />
                    {validator.name && <div className="invalid-feedback">{validator.name}</div>}
                  </div>
                  <div className="w-50">
                    <CFormLabel>Username</CFormLabel>
                    <CFormInput
                      type="text"
                      className={validator.username ? 'is-invalid' : ''}
                      required
                      name="username"
                      value={newUser.username}
                      onChange={handleAddInputChange}
                    />
                    {validator.username && <div className="invalid-feedback">{validator.username}</div>}
                  </div>
                </div>
                <CFormLabel>Email</CFormLabel>
                <CFormInput
                  type="email"
                  className={validator.email ? 'is-invalid' : ''}
                  required
                  name="email"
                  value={newUser.email}
                  onChange={handleAddInputChange}
                />
                {validator.email && <div className="invalid-feedback">{validator.email}</div>}
                <div className="d-flex justify-content-between mb-3 mt-3">
                  <div className="me-2 w-50">
                    <CFormLabel>Gender</CFormLabel>
                    <CFormSelect
                      style={{cursor: "pointer"}}
                      value={newUser.gender}
                      className={validator.gender ? 'is-invalid' : ''}
                      required
                      name="gender"
                      onChange={handleAddInputChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </CFormSelect>
                    {validator.gender && <div className="invalid-feedback">{validator.gender}</div>}
                  </div>
                  <div className="w-50">
                    <CFormLabel>Role</CFormLabel>
                    <CFormSelect
                      style={{cursor: "pointer"}}
                      value={newUser.role}
                      required
                      name="role"
                      onChange={handleAddInputChange}
                    >
                      <option value="manager">Manager</option>
                      <option value="user">User</option>
                    </CFormSelect>
                  </div>
                </div>
                <CFormLabel>Password</CFormLabel>
                <CFormInput
                  type="password"
                  value={newUser.password}
                  name="password"
                  className={validator.password ? 'is-invalid' : ''}
                  onChange={handleAddInputChange}
                />
                {validator.password && <div className="invalid-feedback">{validator.password}</div>}
                <CFormLabel>Confirm Password</CFormLabel>
                <CFormInput
                  type="password"
                  value={newUser.confirmPassword}
                  name="confirmPassword"
                  className={validator.confirmPassword ? 'is-invalid' : ''}
                  onChange={handleAddInputChange}
                />
                {validator.confirmPassword && <div className="invalid-feedback">{validator.confirmPassword}</div>}
              </CForm>
            ) : (
              <div className="d-flex justify-content-center align-items-center" style={{height: "468px"}}>
                <CSpinner color="primary" style={{scale: "1.5"}} />
              </div>
            )
          }
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowAddUserModal(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleAddUser}>
            Add User
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Edit User Modal */}
      <CModal visible={showEditUserModal} onClose={() => {
        setShowEditUserModal(false);
        setSelectedUser(null);
      }}>
        <CModalHeader>
          <CModalTitle>Edit User</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedUser && (
            modalLoading ? (
              <div className="d-flex justify-content-center align-items-center" style={{height: "468px"}}>
                <CSpinner color="primary" style={{scale: "1.5"}} />
              </div>
            ) : (
              <CForm className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between mb-3 mt-3 gap-2">
                  <div className="w-50">
                    <CFormLabel>Full Name</CFormLabel>
                    <CFormInput
                      type="text"
                      value={selectedUser.name}
                      name="name"
                      className={validator.name ? 'is-invalid' : ''}
                      onChange={handleEditInputChange}
                    />
                    {validator.name && <div className="invalid-feedback">{validator.name}</div>}
                  </div>
                  <div className="w-50">
                    <CFormLabel>Username</CFormLabel>
                    <CFormInput
                      type="text"
                      value={selectedUser.username || ''}
                      name="username"
                      className={validator.username ? 'is-invalid' : ''}
                      onChange={handleEditInputChange}
                    />
                    {validator.username && <div className="invalid-feedback">{validator.username}</div>}
                  </div>
                </div>
                    <CFormLabel>Email</CFormLabel>
                    <CFormInput
                      type="email"
                      value={selectedUser.email}
                      name="email"
                      className={validator.email ? 'is-invalid' : ''}
                      onChange={handleEditInputChange}
                    />
                    {validator.email && <div className="invalid-feedback">{validator.email}</div>}
                    <div className="d-flex justify-content-between mb-3 mt-3">
                      <div className="me-2 w-50">
                        <CFormLabel>Gender</CFormLabel>
                        <CFormSelect
                          style={{cursor: "pointer"}}
                          value={selectedUser.gender}
                          name="gender"
                          className={validator.gender ? 'is-invalid' : ''}
                          onChange={handleEditInputChange}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </CFormSelect>
                        {validator.gender && <div className="invalid-feedback">{validator.gender}</div>}
                      </div>
                      <div className="w-50">
                        <CFormLabel>Role</CFormLabel>
                        <CFormSelect
                          style={{cursor: "pointer"}}
                          value={selectedUser.role}
                          name="role"
                          onChange={handleEditInputChange}
                        >
                          <option value="manager">Manager</option>
                          <option value="user">User</option>
                        </CFormSelect>
                      </div>
                    </div>
                    <CFormLabel>Password</CFormLabel>
                    <CFormInput
                      type="password"
                      value={selectedUser.password || ''}
                      name="password"
                      className={validator.password ? 'is-invalid' : ''}
                      onChange={handleEditInputChange}
                    />
                    {validator.password && <div className="invalid-feedback">{validator.password}</div>}
                    <CFormLabel>Confirm Password</CFormLabel>
                    <CFormInput
                      type="password"
                      value={selectedUser.confirmPassword || ''}
                      name="confirmPassword"
                      className={validator.confirmPassword ? 'is-invalid' : ''}
                      onChange={handleEditInputChange}
                    />
                    {validator.confirmPassword && <div className="invalid-feedback">{validator.confirmPassword}</div>}
              </CForm>
            )
            )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowEditUserModal(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleEditUser}>
            Save Changes
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Delete Confirmation Modal */}
      <CModal visible={showDeleteConfirmation} onClose={() => setShowDeleteConfirmation(false)}>
        <CModalHeader>
          <CModalTitle>Confirm Deletion</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Are you sure you want to delete the user: <strong>{selectedUser?.name}</strong>?
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowDeleteConfirmation(false)}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={handleDeleteUser}>
            Delete
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default UserManagement;
