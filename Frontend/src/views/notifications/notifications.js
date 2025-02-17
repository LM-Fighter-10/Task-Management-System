import React, { useEffect, useState, useContext } from "react";
import {Button, ListGroup, Form, Badge, Collapse, Spinner, Pagination} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faCheck, faBell, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { AppContext } from "src/App";
import {CSpinner} from "@coreui/react";
import {Back_Origin} from "../../../../Frontend_ENV";

const typeColors = {
  info: "#17a2b8",    // Blue (Bootstrap info)
  success: "#28a745", // Green (Bootstrap success)
  error: "#dc3545",   // Red (Bootstrap danger)
  warning: "#ffc107", // Yellow (Bootstrap warning)
  admin: "#6f42c1",   // Purple (Bootstrap admin)
};

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false); // Filter for unread notifications
  const { currentUser, showMessage, setHasNewNotifications } = useContext(AppContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setHasNewNotifications(false);
    fetchNotifications();
  }, []);


  const fetchNotifications = async (page = 1, limit = 5, read = null) => {
    try {
      if (!localStorage.getItem("token")) {
        return;
      }
      setLoading(true);
      setCurrentPage(page);
      const response = await fetch(`${Back_Origin}/getNotifications/${currentUser?.id || null}`+
        `?page=${page}&limit=${limit}${read? `&read=${read}`: ''}`, {
        headers: { authorization: `${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      setLoading(false);
      if (!data.error) {
        setTotalPages(data.totalPages);
        setNotifications(data.data);
      } else {
        showMessage(data.error, true);
      }
    } catch (error) {
      setLoading(false);
      showMessage("Something went wrong. Please try again.", true);
    }
  };

  const handleToggleReadCheck = (e) => {
    setShowUnreadOnly(e.target.checked);
    fetchNotifications(1, 5, e.target.checked);
  }

  // Mark as Read
  const toggleReadStatus = async (id, isRead) => {
    try {
      if (!localStorage.getItem("token")) {
        return;
      }
      await fetch(`${Back_Origin}/markAsRead/${id}`, {
        method: "PUT",
        headers: { authorization: `${localStorage.getItem('token')}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      showMessage("Error updating notification", true);
    }
  };

  // Mark as Unread
  const toggleUnreadStatus = async (id, isRead) => {
    try {
      if (!localStorage.getItem("token")) {
        return;
      }
      await fetch(`${Back_Origin}/markAsUnread/${id}`, {
        method: "PUT",
        headers: { authorization: `${localStorage.getItem('token')}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      );
    } catch (error) {
      showMessage("Error updating notification", true);
    }
  }

  // Delete Notification
  const deleteNotification = async (id) => {
    try {
      if (!localStorage.getItem("token")) {
        return;
      }
      setLoading(true);
      await fetch(`${Back_Origin}/deleteNotification/${id}`, {
        method: "DELETE",
        headers: { authorization: `${localStorage.getItem('token')}` },
      });
      await fetchNotifications(notifications.length === 1 ? currentPage - 1 : currentPage, 5, showUnreadOnly);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showMessage("Error deleting notification", true);
    }
  };

  // Clear All Notifications
  const clearNotifications = async () => {
    try {
      if (!localStorage.getItem("token")) {
        return;
      }
      setLoading(true);
      await fetch(`${Back_Origin}/clearNotifications/${currentUser?.id}`, {
        method: "DELETE",
        headers: { authorization: `${localStorage.getItem('token')}` },
      });
      setLoading(false);
      setNotifications([]);
    } catch (error) {
      setLoading(false);
      showMessage("Error clearing notifications", true);
    }
  };

  // Expand/collapse notifications
  const toggleExpand = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, expanded: !n.expanded } : n))
    );
  };

  // Filter unread notifications if toggle is enabled
  const filteredNotifications =
    showUnreadOnly ?
      notifications.filter((n) => !n.isRead)
    : notifications;

  return (
    <div className="p-4">
      <h2 className="mb-4">
        <FontAwesomeIcon icon={faBell} className="me-2" />
        Notifications
      </h2>

      {/* Filter for Unread Notifications */}
      <Form.Check
        type="switch"
        id="unread-filter"
        label="Show Unread Only"
        checked={showUnreadOnly}
        onChange={handleToggleReadCheck}
        className="mb-4"
      />

      {/* Clear All Notifications Button */}
      <Button variant="secondary" onClick={clearNotifications} className="mb-4">
        <FontAwesomeIcon icon={faCheck} className="me-2" />
        Clear All Notifications
      </Button>

      <ListGroup>
      {loading ? (
        <div className="d-flex justify-content-center align-items-center"
             style={{height: "240px", borderRadius: "20px", background: "#80808014"}}>
          <CSpinner color="primary" style={{scale: '1.5'}}/>
        </div>
      ) : (
        <>
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <ListGroup.Item
                key={notification.id}
                className="d-flex flex-column"
                onClick={() => toggleExpand(notification.id)}
                style={{ cursor: "pointer" }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div>[ <span style={{color: typeColors[notification.type]}}>{notification.type.toUpperCase()}</span> ] <span className={notification.isRead ? "text-muted" : "fw-bold"}>{notification.message.substring(0, 50)}...</span>
                    {!notification.isRead && (
                      <Badge bg="primary" className="ms-2">
                        New
                      </Badge>
                    )}
                  </div>
                  <div
                    style={{
                      minWidth: "177px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={notification.expanded ? faChevronUp : faChevronDown}
                      className="me-2"
                    />
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (notification.isRead) {
                          toggleUnreadStatus(notification.id);
                        } else {
                          toggleReadStatus(notification.id);
                        }
                      }}
                      className="me-2"
                    >
                      {notification.isRead ? "Mark as Unread" : "Mark as Read"}
                    </Button>

                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </div>
                </div>

                <Collapse in={notification.expanded}>
                  <div className="mt-3">
                    <p className="mb-0">
                      <strong>Full Message:</strong> {notification.message}
                    </p>
                  </div>
                </Collapse>
              </ListGroup.Item>
            ))
          ) : (
            <p className="text-muted mt-4">No notifications to display.</p>
          )}
        </>
      )}
      </ListGroup>
      {/* Pagination */}
      {!loading && totalPages > 0 && (
        <Pagination className="mt-3 justify-content-center">
          <Pagination.Prev
            onClick={() => currentPage > 1 && fetchNotifications(currentPage - 1, 5, showUnreadOnly)}
            disabled={currentPage === 1} style={{ cursor: "pointer" }}
          />
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <Pagination.Item
              key={page}
              active={page === currentPage}
              onClick={() => currentPage !== page && fetchNotifications(page, 5, showUnreadOnly)}
            >
              {page}
            </Pagination.Item>
          ))}
          <Pagination.Next
            onClick={() => currentPage < totalPages && fetchNotifications(currentPage + 1, 5, showUnreadOnly)}
            disabled={currentPage === totalPages} style={{ cursor: "pointer" }}
          />
        </Pagination>
      )}
    </div>
  );
};

export default NotificationPage;
