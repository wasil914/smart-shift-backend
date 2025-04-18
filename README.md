# smart-shift-backend
1. Smart Auto-Scheduling System

A dynamic full-stack employee shift management system that intelligently schedules shifts based on employee preferences, admin constraints, and fairness logic — built using the **MERN stack**.


2.  Features

3.  Employee Portal
- Secure registration & login
- Set preferred shifts, days off, and max hours/week
- View assigned shifts
- Get notified if preferences couldn’t be fully met

4.  Admin Portal
- Manage employee seniority levels
- Define min/max employees per shift
- View all employee shifts
- Trigger schedule generation

5.  Core Scheduling Logic
- Ensures fair distribution of shifts
- Guarantees 12-hour rest gap between shifts
- At least one senior per shift
- Max 5 shifts per employee per week**
- Adapts to availability changes in real-time

6.  Tech Stack
----------------------------------------------------------
| Layer     | Tech                                       |
|-----------|--------------------------------------------|
| Frontend  | React (Vite), React Router, Axios, AG Grid |
| Backend   | Node.js, Express.js, MongoDB, Mongoose     |
| Auth      | JWT-based Authentication                   |
| Deployment| Vercel (Frontend), Render (Backend)        |
----------------------------------------------------------


7 System Architecture

- **Frontend** calls protected REST APIs for auth, availability, scheduling
- **Backend** contains route handlers, JWT middleware, scheduler service
- **MongoDB** stores users, availability, shifts, and shift config
- Admin-defined config influences scheduling logic in real time

8.  Approach to Solving the Problem

1. Designed modular backend (routes, services, middleware)
2. Implemented scheduling logic to dynamically generate optimized shifts:
   - Based on availability, seniority, rest rules, fairness
3. Added admin dashboard for global config control
4. Built user-specific dashboards with role-based access using React Router
5. Used AG Grid to display shift schedules in an intuitive tabular format

9. Challenges Faced & Tackled

| Challenges Faced|

 Designing a fair, constraint-based scheduler | Broke logic into steps: seniority → hours → rest → fairness 
 Dynamic updates on availability change | Trigger scheduler post every update via backend logic 
 Visualizing user-specific shifts | Used `authContext` to filter and conditionally render shifts 
 Access control | Built `PrivateRoute` and `AdminRoute` wrappers for protected pages 


##10. 🌱 Future Improvements

- Support per-day shift preferences
- Add real-time notifications or email (AWS SES)
- Drag-and-drop shift adjustment for admins
- Add analytics dashboard (shift load, fairness metrics)
- Migrate to GraphQL for optimized data fetching

## 📦 Local Setup

```bash
# Clone the repo
git clone https://github.com/your-username/smart-shift-system.git
cd smart-shift-system

# Start backend
cd smart-shift-backend
npm install
npm run dev

# Start frontend
cd ../smart-shift-frontend
npm install
npm run dev
