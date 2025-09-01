# Keycloak Test Users Setup

## 🔑 Admin Access
- **Admin Console**: http://localhost:8080/admin/
- **Username**: admin
- **Password**: admin

## 👥 Demo Users (To be created manually)

### 1. Doctor User
- **Username**: doctor
- **Password**: doctor123
- **Email**: doctor@hospital.com
- **First Name**: Dr. John
- **Last Name**: Smith
- **Roles**: employee, manager

### 2. Nurse User
- **Username**: nurse
- **Password**: nurse123
- **Email**: nurse@hospital.com
- **First Name**: Sarah
- **Last Name**: Johnson
- **Roles**: employee

### 3. Admin User
- **Username**: admin-user
- **Password**: admin123
- **Email**: admin@hospital.com
- **First Name**: Admin
- **Last Name**: User
- **Roles**: employee, manager

## 📋 How to Create Users

1. Go to http://localhost:8080/admin/
2. Login with admin/admin
3. Select the "demo" realm
4. Go to Users → Add User
5. Fill in the details above
6. Set passwords in the Credentials tab
7. Assign roles in the Role Mappings tab

## 🧪 Testing Authentication

Once users are created, test login at: http://localhost:3000

The app will redirect to Keycloak for authentication, then back to the Hospital Web App.

