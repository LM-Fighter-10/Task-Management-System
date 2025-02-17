<a id="readme-top"></a>
# Task Management System

## Overview

The Task Management System is a web application that allows users to create, assign, track, and manage tasks efficiently. The system provides role-based access control, real-time task updates, and secure authentication. It is designed to enhance collaboration and improve task organization within teams.

## Features

* 🔐 User Authentication – Secure login and session management using JWT.

* 📝 Task Management – Create, update, assign, and delete tasks.

* 🏷 Task Prioritization – Assign priority levels (High, Medium, Low).

* 👥 Role-Based Access Control – Admin, Manager, and User roles.

* 📬 Notifications – Alerts for task updates and assignments.

* 📊 Real-time Status Tracking – Monitor progress of tasks.

## Tech Stack

## Frontend: 
* [![React][React.js]][React-url]
* [Tailwind.css]()


## Backend: 
* [Node.js](https://nodejs.org/)
* [Express.js](https://expressjs.com/)
* MongoDB (Mongoose for ORM)

### Security & Authentication:

* JWT (JSON Web Token)

* Bcrypt.js for password hashing

* Session-based authentication

## Installation & Setup

### Prerequisites:

Ensure you have the following installed:

[Node.js](https://nodejs.org/)

[MongoDB](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-windows/)

* npm (Node Package Manager)

### Steps to Run the Project:

1. Clone the Repository
    ```sh
    git clone https://github.com/bk110306/Task-Management-System-Zidio.git
    cd task-management-system-zidio
    ```

2. Install Dependencies
    ```sh
    npm install
    ```
3. Configure Environment Variables

* Create a ``` env.js``` file in the root directory.

* Add the following variables:
    ```
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret_key
    ```
4. Start the Backend Server (From the root directory):
    ```
    cd Backend
    npm install
    npm start
    ```

5. Start the Frontend (From the root directory):
    ```
    cd Frontend
    npm install
    npm start
    ```
## Usage
1. Create & Assign Tasks

2. Update Task Status

3. Track and Manage Tasks Efficiently

# Future Enhancements

* 📅 Task Scheduling – Due dates & reminders.

* 📱 Mobile App Integration – Responsive design for mobile users.

* 📊 Advanced Reporting & Analytics – Visual insights into project performance and team productivity.

# Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

# License

This project is licensed under the MIT License.

# Contact

For any inquiries, reach out at [taskPulse Team](noreply.taskpulse@gmail.com) or visit our [GitHub Repository](https://github.com/bk110306/Task-Management-System-Zidio.git).


<!-- ACKNOWLEDGMENTS -->
## Developers

* [Muhammad Burhan Khan](https://github.com/bk110306)
* [Omar Alaa Elnahass](https://github.com/LM-Fighter-10)
* [Omotuwa Ojo](https://github.com/omotuwaojo)

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- MARKDOWN LINKS & IMAGES -->
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
