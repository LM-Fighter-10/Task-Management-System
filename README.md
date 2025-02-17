# Task Management System

## Overview

This repository is based on the original project [Task-Management-System-Zidio](https://github.com/bk110306/Task-Management-System-Zidio), developed by Me & Muhammad Burhan Khan. I was a contributor to the original repository and have created this fork to continue development and introduce new features independently.

The Task Management System is a web application designed to help teams efficiently create, assign, track, and manage tasks. It includes role-based access control, real-time task updates, and secure authentication to enhance collaboration and improve task organization.

## Features

* 🔐 **User Authentication** – Secure login and session management using JWT.
* 📝 **Task Management** – Create, update, assign, and delete tasks.
* 🏷 **Task Prioritization** – Assign priority levels (High, Medium, Low).
* 👥 **Role-Based Access Control** – Admin, Manager, and User roles.
* 📬 **Notifications** – Alerts for task updates and assignments.
* 📊 **Real-time Status Tracking** – Monitor progress of tasks.

## Tech Stack

### Frontend:
* [React.js](https://reactjs.org/)
* [Tailwind.css](https://tailwindcss.com/)

### Backend:
* [Node.js](https://nodejs.org/)
* [Express.js](https://expressjs.com/)
* [MongoDB (Mongoose for ORM)](https://www.mongodb.com/)

### Security & Authentication:
* [JWT (JSON Web Token)](https://jwt.io/)
* [Bcrypt.js for password hashing](https://www.npmjs.com/package/bcryptjs)
* Session-based authentication

## Installation & Setup

### Prerequisites:

Ensure you have the following installed:

* [Node.js](https://nodejs.org/)
* [MongoDB](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-windows/)
* npm (Node Package Manager)

### Steps to Run the Project:

1. Clone the Repository:
    ```sh
    git clone <your-repository-url>
    cd task-management-system
    ```

2. Install Dependencies:
    ```sh
    npm install
    ```

3. Configure Environment Variables:

* Create a `.env` file in the root directory.
* Add the following variables:
    ```
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret_key
    ```

4. Start the Backend Server (From the root directory):
    ```sh
    cd Backend
    npm install
    npm start
    ```

5. Start the Frontend (From the root directory):
    ```sh
    cd Frontend
    npm install
    npm start
    ```

## Usage
1. Create & Assign Tasks.
2. Update Task Status.
3. Track and Manage Tasks Efficiently.

## Future Enhancements

* 📅 **Task Scheduling** – Due dates & reminders.
* 📱 **Mobile App Integration** – Responsive design for mobile users.
* 📊 **Advanced Reporting & Analytics** – Visual insights into project performance and team productivity.

## Contributing

Contributions are welcome! Feel free to fork the repository and submit a pull request.

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgment

This project is originally based on the [Task-Management-System-Zidio](https://github.com/bk110306/Task-Management-System-Zidio) repository. All credits to the original developers.

## Contact

For any inquiries, feel free to reach out via GitHub Issues.

<!-- MARKDOWN LINKS & IMAGES -->
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
